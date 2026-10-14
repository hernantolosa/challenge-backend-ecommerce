import { randomUUID } from 'node:crypto';
import { type Server } from 'node:http';
import { MovementReason } from '@stock/domain/enums/movement-reason.enum';
import { FailingStockLedger } from '@test/fakes/failing-stock-ledger';
import {
  DATABASE_FAILURE,
  LEAKED_PARAMETER,
  LEAKED_SQL,
} from '@test/fixtures/database-failure.fixtures';
import { seedVariant } from '@test/fixtures/catalog.fixtures';
import { MOVEMENTS_PATH } from '@test/fixtures/http.fixtures';
import { SNEAKER_SKU } from '@test/fixtures/stock.fixtures';
import { aTraceparent, PARENT_SPAN_ID, TRACE_ID } from '@test/fixtures/trace.fixtures';
import { type LogEntry } from '@test/fakes/memory-log-destination';
import { type TestApp, startTestApp } from '@test/support/test-app';
import { resetTestDatabase } from '@test/support/test-database';
import { issueToken } from '@test/support/tokens';
import { waitForLog } from '@test/support/wait-for-log';
import * as request from 'supertest';

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
        traceparent: aTraceparent(),
      });

      expect(response.headers['x-trace-id']).toBe(TRACE_ID);
      const entry = await waitForLog(testApp.logs, isAccessLog);
      expect(entry).toMatchObject({ traceId: TRACE_ID, parentSpanId: PARENT_SPAN_ID });
      expect(entry.spanId).not.toBe(PARENT_SPAN_ID);
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
        req: { method: 'POST', path: MOVEMENTS_PATH },
        res: { statusCode: 201 },
        outcome: 'Ok',
        user: 'operator-42',
      });
      expect(entry.durationMs).toEqual(expect.any(Number));
      expect(testApp.logs.entries().filter(isAccessLog)).toHaveLength(1);
    });

    it('records the business outcome of a rejected request', async () => {
      await postMovement(11);

      expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({
        level: 'info',
        res: { statusCode: 409 },
        outcome: 'InsufficientStock',
      });
    });

    it('raises authentication failures to warn level', async () => {
      await request(server).post(MOVEMENTS_PATH).send({});

      expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({
        level: 'warn',
        res: { statusCode: 401 },
        outcome: 'Unauthorized',
        user: null,
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
        .map((entry) => (entry.req as { path: string }).path);
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
    expect(JSON.stringify(response.body)).not.toContain(DATABASE_FAILURE);

    const failure = await waitForLog(
      testApp.logs,
      (entry) => entry.message === 'Request failed with a server error',
    );
    expect(failure).toMatchObject({
      level: 'error',
      traceId,
      err: { type: 'QueryFailedError', message: DATABASE_FAILURE, code: '58030' },
    });
    expect((failure.err as { stack: string }).stack).toContain('FailingStockLedger');
    expect(failure.err).not.toHaveProperty('parameters');
    expect(failure.err).not.toHaveProperty('query');
    expect(failure.err).not.toHaveProperty('driverError');
    expect(testApp.logs.raw).not.toContain(LEAKED_PARAMETER);
    expect(testApp.logs.raw).not.toContain(LEAKED_SQL);
    expect(await waitForLog(testApp.logs, isAccessLog)).toMatchObject({
      level: 'error',
      traceId,
      outcome: 'InternalServerError',
    });
  });
});
