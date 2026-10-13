import { randomUUID } from 'node:crypto';
import { type Server } from 'node:http';
import * as request from 'supertest';
import { MovementReason } from '@stock/domain/enums/movement-reason';
import { DATABASE_FAILURE, FailingStockLedger } from '@test/fakes/failing-stock-ledger';
import { seedVariant } from '@test/fixtures/catalog.fixtures';
import { SNEAKER_SKU } from '@test/fixtures/stock.fixtures';
import { type LogEntry } from '@test/support/log-entry.type';
import { startTestApp, type TestApp } from '@test/support/test-app';
import { resetTestDatabase } from '@test/support/test-database';
import { issueToken } from '@test/support/tokens';
import { waitForLog } from '@test/support/wait-for-log';

const MOVEMENTS_PATH = '/stock/movimientos';
const INCOMING_TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const INCOMING_SPAN_ID = '00f067aa0ba902b7';

function isAccessLog(entry: LogEntry): boolean {
  return entry.message === 'request completed';
}

describe('Request logging and tracing', () => {
  let testApp: TestApp;
  let server: Server;
  let token: string;

  function postMovement(quantity: number, headers: Record<string, string> = {}): request.Test {
    const call = request(server)
      .post(MOVEMENTS_PATH)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ sku: SNEAKER_SKU, quantity, reason: MovementReason.SALE });
    Object.entries(headers).forEach(([name, value]) => void call.set(name, value));
    return call;
  }

  beforeAll(async () => {
    testApp = await startTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(async () => {
    await resetTestDatabase(testApp.dataSource);
    await seedVariant(testApp.dataSource, { sku: SNEAKER_SKU, onHand: 10 });
    token = issueToken({ subject: 'operator-42' });
    testApp.logs.clear();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('trace propagation', () => {
    it('returns a trace id on every response', async () => {
      const response = await request(server).get('/health');

      expect(response.headers['x-trace-id']).toMatch(/^[0-9a-f]{32}$/);
    });

    it('continues the trace of an incoming W3C traceparent', async () => {
      const response = await postMovement(1, {
        traceparent: `00-${INCOMING_TRACE_ID}-${INCOMING_SPAN_ID}-01`,
      });

      expect(response.headers['x-trace-id']).toBe(INCOMING_TRACE_ID);
      const entry = await waitForLog(testApp.logs, isAccessLog);
      expect(entry).toMatchObject({ traceId: INCOMING_TRACE_ID, parentSpanId: INCOMING_SPAN_ID });
      expect(entry.spanId).not.toBe(INCOMING_SPAN_ID);
    });

    it('starts a fresh trace when the incoming traceparent is malformed', async () => {
      const response = await postMovement(1, { traceparent: 'forged-trace' });

      expect(response.headers['x-trace-id']).toMatch(/^[0-9a-f]{32}$/);
      expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({ parentSpanId: null });
    });

    it('includes the trace id in error responses so clients can report it', async () => {
      const response = await postMovement(11);

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({ traceId: response.headers['x-trace-id'] });
    });
  });

  describe('access log', () => {
    it('writes one structured line per request', async () => {
      const response = await postMovement(1);

      const entry = await waitForLog(testApp.logs, isAccessLog);
      expect(entry).toMatchObject({
        level: 'info',
        service: 'ecommerce-api',
        environment: 'test',
        traceId: response.headers['x-trace-id'],
        http: { method: 'POST', path: MOVEMENTS_PATH, status: 201 },
        outcome: 'Ok',
        actor: 'operator-42',
      });
      expect((entry.http as { durationMs: unknown }).durationMs).toEqual(expect.any(Number));
      expect(testApp.logs.entries().filter(isAccessLog)).toHaveLength(1);
    });

    it('records the business outcome of a rejected request', async () => {
      await postMovement(11);

      expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({
        level: 'info',
        http: { status: 409 },
        outcome: 'InsufficientStock',
      });
    });

    it('raises authentication failures to warn level', async () => {
      await request(server).post(MOVEMENTS_PATH).send({});

      expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({
        level: 'warn',
        http: { status: 401 },
        outcome: 'Unauthorized',
        actor: null,
      });
    });

    it('never writes tokens or request bodies', async () => {
      await postMovement(1);
      await waitForLog(testApp.logs, isAccessLog);

      expect(testApp.logs.raw).not.toContain(token);
      expect(testApp.logs.raw).not.toContain('quantity');
    });

    it('does not log health checks', async () => {
      await request(server).get('/health');
      await postMovement(1);

      await waitForLog(testApp.logs, isAccessLog);
      const paths = testApp.logs
        .entries()
        .filter(isAccessLog)
        .map((entry) => (entry.http as { path: string }).path);
      expect(paths).toEqual([MOVEMENTS_PATH]);
    });
  });
});

describe('Unexpected failures', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await startTestApp({ stockLedger: new FailingStockLedger() });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('answers a generic 500 and logs the cause with its stack under the same trace', async () => {
    const response = await request(testApp.app.getHttpServer())
      .post(MOVEMENTS_PATH)
      .set('Authorization', `Bearer ${issueToken()}`)
      .set('Idempotency-Key', randomUUID())
      .send({ sku: SNEAKER_SKU, quantity: 1, reason: MovementReason.SALE });

    const traceId = response.headers['x-trace-id'];
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
      code: 'InternalServerError',
      traceId,
    });
    expect(JSON.stringify(response.body)).not.toContain('ECONNREFUSED');

    const failure = await waitForLog(
      testApp.logs,
      (entry) => entry.message === 'Unhandled exception',
    );
    expect(failure).toMatchObject({
      level: 'error',
      traceId,
      error: { type: 'Error', message: DATABASE_FAILURE },
    });
    expect((failure.error as { stack: string }).stack).toContain('FailingStockLedger');
    expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({
      level: 'error',
      traceId,
      outcome: 'InternalServerError',
    });
  });
});
