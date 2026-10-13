import { unwrap } from '../../../../support/unwrap';
import { RecordStockMovement } from '../../../../../src/stock/application/use-cases/record-stock-movement.use-case';
import { MovementReason } from '../../../../../src/stock/domain/enums/movement-reason';
import { FAKE_CLOCK, InMemoryStockLedger } from '../../../../fakes/in-memory-stock-ledger';
import {
  ACTOR,
  aRecordCommand,
  aStockMovement,
  IDEMPOTENCY_KEY,
  OTHER_ACTOR,
  OTHER_IDEMPOTENCY_KEY,
  SNEAKER_SKU,
  UNKNOWN_SKU,
} from '../../../../fixtures/stock.fixtures';

describe('RecordStockMovement', () => {
  let ledger: InMemoryStockLedger;
  let recordStockMovement: RecordStockMovement;

  beforeEach(() => {
    ledger = new InMemoryStockLedger().withStock(SNEAKER_SKU, 10);
    recordStockMovement = new RecordStockMovement(ledger);
  });

  describe('when the movement is valid', () => {
    it('decreases the stock on a sale and returns the recorded movement', async () => {
      const result = await recordStockMovement.execute(aRecordCommand({ quantity: 3 }));

      expect(result).toEqual({
        kind: 'Ok',
        value: {
          replayed: false,
          movement: {
            id: 'movement-1',
            sku: SNEAKER_SKU,
            quantity: 3,
            reason: MovementReason.SALE,
            balanceAfter: 7,
            occurredAt: FAKE_CLOCK,
          },
        },
      });
      expect(ledger.levelOf(SNEAKER_SKU)).toBe(7);
    });

    it.each([MovementReason.RETURN, MovementReason.RESTOCK, MovementReason.ADJUSTMENT_INCREASE])(
      'increases the stock on %s',
      async (reason) => {
        await recordStockMovement.execute(aRecordCommand({ reason, quantity: 5 }));

        expect(ledger.levelOf(SNEAKER_SKU)).toBe(15);
      },
    );

    it('decreases the stock on a manual decrease adjustment', async () => {
      await recordStockMovement.execute(
        aRecordCommand({ reason: MovementReason.ADJUSTMENT_DECREASE, quantity: 4 }),
      );

      expect(ledger.levelOf(SNEAKER_SKU)).toBe(6);
    });

    it('allows selling the last available unit, leaving the stock at zero', async () => {
      const result = await recordStockMovement.execute(aRecordCommand({ quantity: 10 }));

      expect(result).toMatchObject({ kind: 'Ok', value: { movement: { balanceAfter: 0 } } });
      expect(ledger.levelOf(SNEAKER_SKU)).toBe(0);
    });

    it('normalizes the sku before looking up the variant', async () => {
      const result = await recordStockMovement.execute(
        aRecordCommand({ sku: SNEAKER_SKU.toLowerCase() }),
      );

      expect(result).toMatchObject({ kind: 'Ok', value: { movement: { sku: SNEAKER_SKU } } });
    });

    it('records who performed the movement', async () => {
      await recordStockMovement.execute(aRecordCommand());

      expect(ledger.movements.map((movement) => movement.actor)).toEqual([ACTOR]);
    });
  });

  describe('when there is not enough stock', () => {
    it('rejects the movement reporting what is available', async () => {
      const result = await recordStockMovement.execute(aRecordCommand({ quantity: 11 }));

      expect(result).toEqual({
        kind: 'InsufficientStock',
        error: { kind: 'InsufficientStock', sku: SNEAKER_SKU, requested: 11, available: 10 },
      });
    });

    it('leaves the stock and the ledger untouched', async () => {
      await recordStockMovement.execute(aRecordCommand({ quantity: 11 }));

      expect(ledger.levelOf(SNEAKER_SKU)).toBe(10);
      expect(ledger.movements).toHaveLength(0);
    });

    it('does not consume the idempotency key, so the client can retry after a restock', async () => {
      await recordStockMovement.execute(aRecordCommand({ quantity: 11 }));
      ledger.withStock(SNEAKER_SKU, 20);

      const retry = await recordStockMovement.execute(aRecordCommand({ quantity: 11 }));

      expect(retry).toMatchObject({
        kind: 'Ok',
        value: { replayed: false, movement: { balanceAfter: 9 } },
      });
    });
  });

  describe('when the variant does not exist', () => {
    it('rejects the movement', async () => {
      const result = await recordStockMovement.execute(aRecordCommand({ sku: UNKNOWN_SKU }));

      expect(result).toEqual({
        kind: 'VariantNotFound',
        error: { kind: 'VariantNotFound', sku: UNKNOWN_SKU },
      });
      expect(ledger.movements).toHaveLength(0);
    });
  });

  describe('when the command breaks an invariant', () => {
    it.each([
      ['sku', aRecordCommand({ sku: 'NOT A SKU' })],
      ['quantity', aRecordCommand({ quantity: 0 })],
      ['quantity', aRecordCommand({ quantity: 2.5 })],
      ['idempotencyKey', aRecordCommand({ idempotencyKey: 'not-a-uuid' })],
    ])('rejects an invalid %s without touching the ledger', async (field, command) => {
      const result = await recordStockMovement.execute(command);

      expect(result).toMatchObject({
        kind: 'InvariantViolated',
        error: { kind: 'InvariantViolated', field },
      });
      expect(ledger.movements).toHaveLength(0);
      expect(ledger.levelOf(SNEAKER_SKU)).toBe(10);
    });
  });

  describe('idempotency', () => {
    it('replays the original movement when the same request is retried', async () => {
      const first = await recordStockMovement.execute(aRecordCommand());
      const retry = await recordStockMovement.execute(aRecordCommand());

      expect(unwrap(retry).movement).toEqual(unwrap(first).movement);
      expect(retry).toMatchObject({ kind: 'Ok', value: { replayed: true } });
    });

    it('applies the stock change only once across retries', async () => {
      await recordStockMovement.execute(aRecordCommand());
      await recordStockMovement.execute(aRecordCommand());
      await recordStockMovement.execute(aRecordCommand());

      expect(ledger.levelOf(SNEAKER_SKU)).toBe(8);
      expect(ledger.movements).toHaveLength(1);
    });

    it('treats a retry with a differently formatted but equivalent request as the same', async () => {
      await recordStockMovement.execute(aRecordCommand());

      const retry = await recordStockMovement.execute(
        aRecordCommand({
          sku: SNEAKER_SKU.toLowerCase(),
          idempotencyKey: IDEMPOTENCY_KEY.toUpperCase(),
        }),
      );

      expect(retry).toMatchObject({ kind: 'Ok', value: { replayed: true } });
    });

    it('rejects reusing a key for a different request', async () => {
      await recordStockMovement.execute(aRecordCommand({ quantity: 2 }));

      const result = await recordStockMovement.execute(aRecordCommand({ quantity: 5 }));

      expect(result).toEqual({
        kind: 'IdempotencyKeyReused',
        error: { kind: 'IdempotencyKeyReused', idempotencyKey: IDEMPOTENCY_KEY },
      });
      expect(ledger.levelOf(SNEAKER_SKU)).toBe(8);
    });

    it('records different keys as independent movements', async () => {
      await recordStockMovement.execute(aRecordCommand());
      await recordStockMovement.execute(aRecordCommand({ idempotencyKey: OTHER_IDEMPOTENCY_KEY }));

      expect(ledger.levelOf(SNEAKER_SKU)).toBe(6);
    });

    it('scopes keys per actor, so one actor cannot replay or block another', async () => {
      await recordStockMovement.execute(aRecordCommand());

      const result = await recordStockMovement.execute(aRecordCommand({ actor: OTHER_ACTOR }));

      expect(result).toMatchObject({ kind: 'Ok', value: { replayed: false } });
      expect(ledger.levelOf(SNEAKER_SKU)).toBe(6);
    });
  });

  describe('when a concurrent request with the same key wins the race', () => {
    it('replays the movement recorded by the winner', async () => {
      const winner = aStockMovement({ id: 'winner', balanceAfter: 8 });
      ledger.simulateConcurrentWinner(winner);

      const result = await recordStockMovement.execute(aRecordCommand());

      expect(result).toMatchObject({
        kind: 'Ok',
        value: { replayed: true, movement: { id: 'winner' } },
      });
    });

    it('rejects the request when the winner used the key for a different request', async () => {
      ledger.simulateConcurrentWinner(aStockMovement({ quantity: 9 }));

      const result = await recordStockMovement.execute(aRecordCommand({ quantity: 2 }));

      expect(result).toEqual({
        kind: 'IdempotencyKeyReused',
        error: { kind: 'IdempotencyKeyReused', idempotencyKey: IDEMPOTENCY_KEY },
      });
    });
  });
});
