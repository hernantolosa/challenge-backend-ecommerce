import { type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { Scope } from '../../../src/auth/scope';
import { MovementReason } from '../../../src/stock/domain/movement-reason';
import { onHandOf, seedVariant, type SeededVariant } from '../../fixtures/catalog.fixtures';
import { IDEMPOTENCY_KEY, SNEAKER_SKU, UNKNOWN_SKU } from '../../fixtures/stock.fixtures';
import { startTestApp, type TestApp } from '../../support/test-app';
import { resetTestDatabase } from '../../support/test-database';
import { forgeUnsignedToken, issueToken, issueTokenWithoutExpiry } from '../../support/tokens';

const MOVEMENTS_PATH = '/stock/movimientos';

interface MovementBody {
  readonly sku?: unknown;
  readonly quantity?: unknown;
  readonly reason?: unknown;
  readonly [extra: string]: unknown;
}

function aMovementBody(overrides: MovementBody = {}): MovementBody {
  return { sku: SNEAKER_SKU, quantity: 2, reason: MovementReason.SALE, ...overrides };
}

describe('Stock HTTP API', () => {
  let testApp: TestApp;
  let server: Server;
  let variant: SeededVariant;

  function postMovement(
    body: MovementBody = aMovementBody(),
    idempotencyKey: string | null = randomUUID(),
    token: string | null = issueToken(),
  ): request.Test {
    const call = request(server).post(MOVEMENTS_PATH).send(body);
    if (idempotencyKey !== null) void call.set('Idempotency-Key', idempotencyKey);
    if (token !== null) void call.set('Authorization', `Bearer ${token}`);
    return call;
  }

  function postRawJson(rawBody: string): request.Test {
    return request(server)
      .post(MOVEMENTS_PATH)
      .set('Authorization', `Bearer ${issueToken()}`)
      .set('Idempotency-Key', randomUUID())
      .set('Content-Type', 'application/json')
      .send(rawBody);
  }

  beforeAll(async () => {
    testApp = await startTestApp();
    server = testApp.app.getHttpServer();
  });

  beforeEach(async () => {
    await resetTestDatabase(testApp.dataSource);
    variant = await seedVariant(testApp.dataSource, { sku: SNEAKER_SKU, onHand: 10 });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe('POST /stock/movimientos', () => {
    it('records a movement and returns 201 with the resulting balance', async () => {
      const response = await postMovement(aMovementBody({ quantity: 3 }));

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        sku: SNEAKER_SKU,
        quantity: 3,
        reason: MovementReason.SALE,
        balanceAfter: 7,
      });
      expect(Object.keys(response.body as object).sort()).toEqual([
        'balanceAfter',
        'id',
        'occurredAt',
        'quantity',
        'reason',
        'sku',
      ]);
      expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(7);
    });

    it('accepts a lowercase sku', async () => {
      const response = await postMovement(aMovementBody({ sku: SNEAKER_SKU.toLowerCase() }));

      expect(response.status).toBe(201);
    });

    it('returns 409 with the available stock when there is not enough', async () => {
      const response = await postMovement(aMovementBody({ quantity: 11 }));

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        error: 'InsufficientStock',
        requested: 11,
        available: 10,
      });
      expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(10);
    });

    it('returns 404 for an unknown variant', async () => {
      const response = await postMovement(aMovementBody({ sku: UNKNOWN_SKU }));

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ error: 'VariantNotFound' });
    });

    describe('idempotency', () => {
      it('replays a retried request with 200 and does not apply it twice', async () => {
        const first = await postMovement(aMovementBody(), IDEMPOTENCY_KEY);
        const retry = await postMovement(aMovementBody(), IDEMPOTENCY_KEY);

        expect(first.status).toBe(201);
        expect(retry.status).toBe(200);
        expect(retry.headers['idempotent-replayed']).toBe('true');
        expect(retry.body).toEqual(first.body);
        expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(8);
      });

      it('returns 422 when a key is reused for a different request', async () => {
        await postMovement(aMovementBody({ quantity: 2 }), IDEMPOTENCY_KEY);

        const response = await postMovement(aMovementBody({ quantity: 3 }), IDEMPOTENCY_KEY);

        expect(response.status).toBe(422);
        expect(response.body).toMatchObject({ error: 'IdempotencyKeyReused' });
      });

      it('returns 400 when the Idempotency-Key header is missing', async () => {
        const response = await postMovement(aMovementBody(), null);

        expect(response.status).toBe(400);
      });

      it('returns 400 when the Idempotency-Key is not a UUID', async () => {
        const response = await postMovement(aMovementBody(), 'retry-1');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          error: 'InvariantViolated',
          field: 'idempotencyKey',
        });
      });
    });

    describe('input validation', () => {
      it.each([
        ['a missing sku', aMovementBody({ sku: undefined })],
        ['a numeric sku', aMovementBody({ sku: 123 })],
        ['a quantity sent as a string', aMovementBody({ quantity: '2' })],
        ['a fractional quantity', aMovementBody({ quantity: 1.5 })],
        ['an unknown reason', aMovementBody({ reason: 'THEFT' })],
        ['a lowercase reason', aMovementBody({ reason: 'sale' })],
        ['an unexpected field', aMovementBody({ balanceAfter: 999 })],
      ])('returns 400 for %s', async (_case, body) => {
        const response = await postMovement(body);

        expect(response.status).toBe(400);
        expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(10);
      });

      it.each([
        ['quantity', aMovementBody({ quantity: 0 })],
        ['quantity', aMovementBody({ quantity: -5 })],
        ['quantity', aMovementBody({ quantity: 100_001 })],
        ['sku', aMovementBody({ sku: "SNK'; DROP TABLE variants;--" })],
      ])('returns 400 when the %s breaks a domain invariant', async (field, body) => {
        const response = await postMovement(body);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ error: 'InvariantViolated', field });
      });

      it('returns 400 for malformed JSON', async () => {
        const response = await postRawJson('{"sku": ');

        expect(response.status).toBe(400);
      });

      it('drops a __proto__ key without polluting object prototypes', async () => {
        const response = await postRawJson(
          `{"sku":"${SNEAKER_SKU}","quantity":1,"reason":"SALE","__proto__":{"polluted":true}}`,
        );

        expect(response.status).toBe(201);
        expect(Object.prototype).not.toHaveProperty('polluted');
        expect({}).not.toHaveProperty('polluted');
      });

      it('returns 413 for an oversized payload', async () => {
        const response = await postMovement(aMovementBody({ sku: 'A'.repeat(20_000) }));

        expect(response.status).toBe(413);
      });
    });

    describe('authentication and authorization', () => {
      it.each([
        ['no token', null],
        ['a token signed with another secret', issueToken({ secret: 'x'.repeat(48) })],
        ['an expired token', issueToken({ expiresInSeconds: -10 })],
        ['a token from another issuer', issueToken({ issuer: 'https://evil.example' })],
        ['a token for another audience', issueToken({ audience: 'another-api' })],
        ['an unsigned alg none token', forgeUnsignedToken()],
        ['a token without expiration', issueTokenWithoutExpiry()],
        ['a malformed token', 'not.a.jwt'],
      ])('returns 401 with %s', async (_case, token) => {
        const response = await postMovement(aMovementBody(), randomUUID(), token);

        expect(response.status).toBe(401);
        expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(10);
      });

      it('returns 403 when the token lacks the stock:write scope', async () => {
        const token = issueToken({ scopes: [Scope.STOCK_READ] });

        const response = await postMovement(aMovementBody(), randomUUID(), token);

        expect(response.status).toBe(403);
      });

      it('records the token subject as the actor of the movement', async () => {
        await postMovement(aMovementBody(), IDEMPOTENCY_KEY, issueToken({ subject: 'auditor-7' }));

        const [row] = await testApp.dataSource.query<{ actor: string }[]>(
          'SELECT actor FROM stock_movements',
        );
        expect(row?.actor).toBe('auditor-7');
      });
    });

    it('never oversells under concurrent requests', async () => {
      const responses = await Promise.all(
        Array.from({ length: 30 }, () => postMovement(aMovementBody({ quantity: 1 }))),
      );

      const statuses = responses.map((response) => response.status);
      expect(statuses.filter((status) => status === 201)).toHaveLength(10);
      expect(statuses.filter((status) => status === 409)).toHaveLength(20);
      expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(0);
    });
  });

  describe('GET /stock/:sku', () => {
    it('returns the available stock', async () => {
      const response = await request(server)
        .get(`/stock/${SNEAKER_SKU}`)
        .set('Authorization', `Bearer ${issueToken({ scopes: [Scope.STOCK_READ] })}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sku: SNEAKER_SKU, onHand: 10 });
    });

    it('returns 404 for an unknown variant', async () => {
      const response = await request(server)
        .get(`/stock/${UNKNOWN_SKU}`)
        .set('Authorization', `Bearer ${issueToken()}`);

      expect(response.status).toBe(404);
    });

    it('returns 403 without the stock:read scope', async () => {
      const response = await request(server)
        .get(`/stock/${SNEAKER_SKU}`)
        .set('Authorization', `Bearer ${issueToken({ scopes: [Scope.STOCK_WRITE] })}`);

      expect(response.status).toBe(403);
    });
  });

  describe('hardening', () => {
    it('keeps the health check public', async () => {
      const response = await request(server).get('/health');

      expect(response.status).toBe(200);
    });

    it('sends security headers and hides the framework', async () => {
      const response = await request(server).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('does not leak internals on errors', async () => {
      const response = await postMovement(aMovementBody({ sku: UNKNOWN_SKU }));

      expect(JSON.stringify(response.body)).not.toMatch(
        /stack|QueryFailedError|SELECT|stock_levels/,
      );
    });
  });
});
