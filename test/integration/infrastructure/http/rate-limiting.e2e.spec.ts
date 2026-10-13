import { type Server } from 'node:http';
import * as request from 'supertest';
import { MOVEMENTS_PATH } from '@test/fixtures/http.fixtures';
import { type TestApp } from '@test/support/interfaces/test-app.interface';
import { startTestApp } from '@test/support/test-app';

const LIMIT = 3;
const FIRST_CLIENT = '203.0.113.10';
const SECOND_CLIENT = '203.0.113.20';

function unauthenticatedPost(server: Server, forwardedFor: string): request.Test {
  return request(server).post(MOVEMENTS_PATH).set('X-Forwarded-For', forwardedFor).send({});
}

async function exhaustLimit(server: Server, forwardedFor: string): Promise<number[]> {
  const statuses: number[] = [];
  for (let attempt = 0; attempt <= LIMIT; attempt++) {
    statuses.push((await unauthenticatedPost(server, forwardedFor)).status);
  }
  return statuses;
}

describe('Rate limiting behind a trusted proxy', () => {
  let testApp: TestApp;
  let server: Server;

  beforeAll(async () => {
    testApp = await startTestApp({ environment: { THROTTLE_LIMIT: LIMIT, TRUST_PROXY_HOPS: 1 } });
    server = testApp.app.getHttpServer();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('limits each client by its forwarded address, including unauthenticated attempts', async () => {
    expect(await exhaustLimit(server, FIRST_CLIENT)).toEqual([401, 401, 401, 429]);
  });

  it('does not let one client exhaust the limit of another one behind the same proxy', async () => {
    expect((await unauthenticatedPost(server, SECOND_CLIENT)).status).toBe(401);
  });

  it('answers 429 as problem details', async () => {
    const response = await unauthenticatedPost(server, FIRST_CLIENT);

    expect(response.status).toBe(429);
    expect(response.body).toMatchObject({ status: 429, code: 'TooManyRequests' });
  });

  it('never throttles the health check used by the orchestrator', async () => {
    const statuses = await Promise.all(
      Array.from({ length: LIMIT * 3 }, async () => (await request(server).get('/health')).status),
    );

    expect(statuses.every((status) => status === 200)).toBe(true);
  });
});

describe('Rate limiting without a trusted proxy', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await startTestApp({ environment: { THROTTLE_LIMIT: LIMIT, TRUST_PROXY_HOPS: 0 } });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('ignores spoofed X-Forwarded-For headers so a client cannot reset its own limit', async () => {
    const server: Server = testApp.app.getHttpServer();
    const statuses: number[] = [];
    for (let attempt = 0; attempt <= LIMIT; attempt++) {
      statuses.push((await unauthenticatedPost(server, `198.51.100.${attempt}`)).status);
    }

    expect(statuses).toEqual([401, 401, 401, 429]);
  });
});
