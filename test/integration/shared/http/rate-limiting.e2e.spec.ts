import { type Server } from 'node:http';
import { seedVariant } from '@test/fixtures/catalog.fixtures';
import { SNEAKER_SKU } from '@test/fixtures/stock.fixtures';
import { type TestApp, startTestApp } from '@test/support/test-app';
import { resetTestDatabase } from '@test/support/test-database';
import { issueToken } from '@test/support/tokens';
import * as request from 'supertest';

const LIMIT = 2;

describe('Rate limiting', () => {
  let testApp: TestApp;
  let server: Server;

  function getStock(): request.Test {
    return request(server)
      .get(`/stock/${SNEAKER_SKU}`)
      .set('Authorization', `Bearer ${issueToken()}`);
  }

  beforeEach(async () => {
    testApp = await startTestApp({ environment: { THROTTLE_LIMIT: LIMIT } });
    server = testApp.app.getHttpServer();
    await resetTestDatabase(testApp.dataSource);
    await seedVariant(testApp.dataSource, { sku: SNEAKER_SKU, onHand: 10 });
  });

  afterEach(async () => {
    await testApp.app.close();
  });

  it('answers 429 as problem details once a client exceeds the limit', async () => {
    for (let call = 0; call < LIMIT; call++) expect((await getStock()).status).toBe(200);

    const response = await getStock();

    expect(response.status).toBe(429);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.headers['retry-after']).toEqual(expect.any(String));
  });

  it('never throttles the health check', async () => {
    const statuses: number[] = [];
    for (let call = 0; call < LIMIT * 3; call++) {
      statuses.push((await request(server).get('/health')).status);
    }

    expect(statuses.every((status) => status === 200)).toBe(true);
  });
});
