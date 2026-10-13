import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { MOVEMENTS_PATH } from '@test/fixtures/http.fixtures';
import { type QueryRunner } from 'typeorm';
import { MovementReason } from '@stock/domain/enums/movement-reason';
import { onHandOf, seedVariant } from '@test/fixtures/catalog.fixtures';
import { type SeededVariant } from '@test/fixtures/interfaces/seeded-variant.interface';
import { SNEAKER_SKU } from '@test/fixtures/stock.fixtures';
import { type TestApp } from '@test/support/interfaces/test-app.interface';
import { startTestApp } from '@test/support/test-app';
import { resetTestDatabase } from '@test/support/test-database';
import { issueToken } from '@test/support/tokens';
import { waitForLog } from '@test/support/wait-for-log';

const LOCK_TIMEOUT_MS = 200;

describe('When the database cannot serve a request in time', () => {
  let testApp: TestApp;
  let variant: SeededVariant;
  let blocker: QueryRunner;

  function postSale(): request.Test {
    return request(testApp.app.getHttpServer())
      .post(MOVEMENTS_PATH)
      .set('Authorization', `Bearer ${issueToken()}`)
      .set('Idempotency-Key', randomUUID())
      .send({ sku: SNEAKER_SKU, quantity: 1, reason: MovementReason.SALE });
  }

  beforeAll(async () => {
    testApp = await startTestApp({ environment: { DB_LOCK_TIMEOUT_MS: LOCK_TIMEOUT_MS } });
  });

  beforeEach(async () => {
    await resetTestDatabase(testApp.dataSource);
    variant = await seedVariant(testApp.dataSource, { sku: SNEAKER_SKU, onHand: 10 });
    testApp.logs.clear();
    blocker = testApp.dataSource.createQueryRunner();
    await blocker.startTransaction();
    await blocker.query('SELECT 1 FROM stock_levels WHERE variant_id = $1 FOR UPDATE', [
      variant.variantId,
    ]);
  });

  afterEach(async () => {
    if (blocker.isTransactionActive) await blocker.rollbackTransaction();
    await blocker.release();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('fails fast with 503 and Retry-After instead of hanging on a held lock', async () => {
    const startedAt = Date.now();

    const response = await postSale();

    expect(response.status).toBe(503);
    expect(response.headers['retry-after']).toBe('1');
    expect(response.body).toMatchObject({ status: 503, code: 'ServiceUnavailable' });
    expect(Date.now() - startedAt).toBeLessThan(2_000);
  });

  it('logs the cause under the request trace', async () => {
    const response = await postSale();

    expect(
      await waitForLog(
        testApp.logs,
        (entry) =>
          entry.message === 'Request failed with a server error' &&
          entry.traceId === response.headers['x-trace-id'],
      ),
    ).toMatchObject({ level: 'error', error: { code: '55P03' } });
  });

  it('serves the request normally once the lock is released', async () => {
    await blocker.rollbackTransaction();

    const response = await postSale();

    expect(response.status).toBe(201);
    expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(9);
  });
});
