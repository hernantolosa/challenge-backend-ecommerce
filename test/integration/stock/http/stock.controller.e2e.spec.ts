import { type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StockScope } from '@stock/adapters/http/stock.scopes';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock.constants';
import { MovementReason } from '@stock/domain/enums/movement-reason.enum';
import { onHandOf, seedVariant, type SeededVariant } from '@test/fixtures/catalog.fixtures';
import { IDEMPOTENCY_KEY, SNEAKER_SKU, UNKNOWN_SKU } from '@test/fixtures/stock.fixtures';
import { type TestApp, startTestApp } from '@test/support/test-app';
import { aMovementBody, MOVEMENTS_PATH, type MovementBody } from '@test/fixtures/http.fixtures';
import { resetTestDatabase } from '@test/support/test-database';
import { forgeUnsignedToken, issueToken } from '@test/support/tokens';
import * as request from 'supertest';

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
        code: 'InsufficientStock',
        requested: 11,
        available: 10,
      });
      expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(10);
    });

    it('returns 409 when a restock would exceed the stock capacity', async () => {
      await seedVariant(testApp.dataSource, { sku: 'SNK-FULL', onHand: MAX_STOCK_LEVEL - 1 });

      const response = await postMovement(
        aMovementBody({ sku: 'SNK-FULL', quantity: 2, reason: MovementReason.RESTOCK }),
      );

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        code: 'StockCapacityExceeded',
        requested: 2,
        onHand: MAX_STOCK_LEVEL - 1,
        capacity: MAX_STOCK_LEVEL,
      });
    });

    it('returns 404 for an unknown variant', async () => {
      const response = await postMovement(aMovementBody({ sku: UNKNOWN_SKU }));

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ code: 'VariantNotFound' });
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
        expect(response.body).toMatchObject({ code: 'IdempotencyKeyReused' });
      });

      it('treats an uppercase key as the same key', async () => {
        await postMovement(aMovementBody(), IDEMPOTENCY_KEY);

        const retry = await postMovement(aMovementBody(), IDEMPOTENCY_KEY.toUpperCase());

        expect(retry.status).toBe(200);
        expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(8);
      });

      it('scopes keys to the creator so two clients cannot collide', async () => {
        const first = await postMovement(
          aMovementBody(),
          IDEMPOTENCY_KEY,
          issueToken({ subject: 'store-a' }),
        );
        const second = await postMovement(
          aMovementBody(),
          IDEMPOTENCY_KEY,
          issueToken({ subject: 'store-b' }),
        );

        expect([first.status, second.status]).toEqual([201, 201]);
        expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(6);
      });

      it('returns 400 when the Idempotency-Key header is missing', async () => {
        const response = await postMovement(aMovementBody(), null);

        expect(response.status).toBe(400);
      });

      it('returns 400 when the Idempotency-Key is not a UUID', async () => {
        const response = await postMovement(aMovementBody(), 'retry-1');

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          code: 'BadRequest',
          errors: ['Idempotency-Key must be a valid UUID'],
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
        ['a zero quantity', aMovementBody({ quantity: 0 }), 'quantity must not be less than 1'],
        [
          'a negative quantity',
          aMovementBody({ quantity: -5 }),
          'quantity must not be less than 1',
        ],
        [
          'a quantity above the limit',
          aMovementBody({ quantity: 100_001 }),
          'quantity must not be greater than 100000',
        ],
        [
          'a malformed sku',
          aMovementBody({ sku: "SNK'; DROP TABLE variants;--" }),
          'sku must contain only letters, digits and single hyphens',
        ],
      ])('rejects %s at the edge before reaching the domain', async (_case, body, error) => {
        const response = await postMovement(body);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ code: 'BadRequest', errors: [error] });
      });

      it('drops a __proto__ key without polluting object prototypes', async () => {
        const response = await postRawJson(
          `{"sku":"${SNEAKER_SKU}","quantity":1,"reason":"SALE","__proto__":{"polluted":true}}`,
        );

        expect(response.status).toBe(201);
        expect(Object.prototype).not.toHaveProperty('polluted');
        expect({}).not.toHaveProperty('polluted');
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
        ['a token without expiration', issueToken({ withoutExpiry: true })],
        ['a malformed token', 'not.a.jwt'],
        ['a subject with control characters', issueToken({ subject: 'operator\u0000-1' })],
        ['an empty subject', issueToken({ subject: '' })],
      ])('returns 401 with %s', async (_case, token) => {
        const response = await postMovement(aMovementBody(), randomUUID(), token);

        expect(response.status).toBe(401);
        expect(await onHandOf(testApp.dataSource, variant.variantId)).toBe(10);
      });

      it('answers every authentication failure with the same message', async () => {
        const responses = await Promise.all([
          postMovement(aMovementBody(), randomUUID(), null),
          postMovement(aMovementBody(), randomUUID(), issueToken({ secret: 'x'.repeat(48) })),
          postMovement(aMovementBody(), randomUUID(), issueToken({ subject: '' })),
        ]);

        const details = responses.map((response) => (response.body as { detail: string }).detail);
        expect(new Set(details)).toEqual(new Set(['Authentication required']));
      });

      it('returns 403 when the token lacks the stock:write scope', async () => {
        const token = issueToken({ scopes: [StockScope.READ] });

        const response = await postMovement(aMovementBody(), randomUUID(), token);

        expect(response.status).toBe(403);
      });

      it('records the token subject as the creator of the movement', async () => {
        await postMovement(aMovementBody(), IDEMPOTENCY_KEY, issueToken({ subject: 'auditor-7' }));

        const [row] = await testApp.dataSource.query<{ createdBy: string }[]>(
          'SELECT created_by AS "createdBy" FROM stock_movements',
        );
        expect(row?.createdBy).toBe('auditor-7');
      });
    });

    it('replays concurrent retries of a request that took the last unit', async () => {
      await seedVariant(testApp.dataSource, { sku: 'SNK-LAST-ONE', onHand: 1 });

      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          postMovement(aMovementBody({ sku: 'SNK-LAST-ONE', quantity: 1 }), IDEMPOTENCY_KEY),
        ),
      );

      const statuses = responses.map((response) => response.status).sort();
      expect(statuses).toEqual([200, 200, 200, 200, 201]);
      const created = responses.find((response) => response.status === 201);
      responses
        .filter((response) => response.status === 200)
        .forEach((replay) => {
          expect(replay.headers['idempotent-replayed']).toBe('true');
          expect(replay.body).toEqual(created?.body);
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
        .set('Authorization', `Bearer ${issueToken({ scopes: [StockScope.READ] })}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ sku: SNEAKER_SKU, onHand: 10 });
    });

    it('returns 400 for a malformed sku in the path', async () => {
      const response = await request(server)
        .get('/stock/not_a_sku')
        .set('Authorization', `Bearer ${issueToken()}`);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: 'BadRequest',
        errors: ['sku must contain only letters, digits and single hyphens'],
      });
    });

    it('accepts a lowercase sku in the path', async () => {
      const response = await request(server)
        .get(`/stock/${SNEAKER_SKU.toLowerCase()}`)
        .set('Authorization', `Bearer ${issueToken({ scopes: [StockScope.READ] })}`);

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
        .set('Authorization', `Bearer ${issueToken({ scopes: [StockScope.WRITE] })}`);

      expect(response.status).toBe(403);
    });
  });

  describe('error responses', () => {
    it.each([
      ['a business failure', 409, 'InsufficientStock', aMovementBody({ quantity: 11 })],
      ['a validation failure', 400, 'BadRequest', aMovementBody({ reason: 'THEFT' })],
    ])('formats %s as RFC 9457 problem details', async (_case, status, code, body) => {
      const response = await postMovement(body);

      expect(response.status).toBe(status);
      expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
      expect(response.body).toMatchObject({ type: 'about:blank', status, code });
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('detail');
    });

    it('reports every invalid field of the request at once', async () => {
      const response = await postMovement(
        aMovementBody({ sku: 'NOT A SKU', quantity: 0, reason: 'THEFT' }),
      );

      expect(response.body).toMatchObject({
        code: 'BadRequest',
        detail: 'Request validation failed',
      });
      expect((response.body as { errors: string[] }).errors).toEqual(
        expect.arrayContaining([
          'sku must contain only letters, digits and single hyphens',
          'quantity must not be less than 1',
          expect.stringContaining('reason must be one of the following values') as unknown,
        ]),
      );
    });

    it.each([
      ['an unauthenticated request', 401, 'Unauthorized', null],
      ['a forbidden request', 403, 'Forbidden', issueToken({ scopes: [StockScope.READ] })],
    ])('formats %s as problem details', async (_case, status, code, token) => {
      const response = await postMovement(aMovementBody(), randomUUID(), token);

      expect(response.status).toBe(status);
      expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
      expect(response.body).toMatchObject({ type: 'about:blank', status, code });
    });

    it('formats body parser failures as problem details', async () => {
      const response = await postRawJson('{"sku": ');

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
      expect(response.body).toMatchObject({ status: 400, code: 'BadRequest' });
    });

    it('formats an oversized payload as problem details', async () => {
      const response = await postMovement(aMovementBody({ sku: 'A'.repeat(20_000) }));

      expect(response.status).toBe(413);
      expect(response.body).toMatchObject({ status: 413, code: 'PayloadTooLarge' });
    });
  });

  describe('hardening', () => {
    it('keeps the health check public even when a broken token is sent', async () => {
      const response = await request(server)
        .get('/health')
        .set('Authorization', 'Bearer not.a.jwt');

      expect(response.status).toBe(200);
    });

    it('sends security headers and hides the framework', async () => {
      const response = await request(server).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });
});
