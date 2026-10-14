import { type DataSource } from 'typeorm';
import { PostgresStockLedgerAdapter } from '@stock/adapters/persistence/postgres-stock-ledger.adapter';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';
import { type RecordedMovement } from '@stock/application/ports/recorded-movement.interface';
import { type Result } from '@shared/result/result.type';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock.constants';
import { MovementReason } from '@stock/domain/enums/movement-reason.enum';
import {
  movementCountOf,
  onHandOf,
  seedVariant,
  type SeededVariant,
} from '@test/fixtures/catalog.fixtures';
import { aLedgerEntry } from '@test/fixtures/ledger-entry.fixtures';
import {
  OPERATOR,
  aSku,
  IDEMPOTENCY_KEY,
  OTHER_OPERATOR,
  SNEAKER_SKU,
  UNKNOWN_SKU,
} from '@test/fixtures/stock.fixtures';
import { unwrap } from '@test/support/unwrap';
import { openTestDatabase, resetTestDatabase } from '@test/support/test-database';

function wasAlreadyRecorded(result: Result<RecordedMovement, RecordEntryError>): boolean {
  return result.kind === 'Ok' && result.value.alreadyRecorded;
}

describe('PostgresStockLedgerAdapter', () => {
  let dataSource: DataSource;
  let ledger: PostgresStockLedgerAdapter;
  let variant: SeededVariant;

  beforeAll(async () => {
    dataSource = await openTestDatabase();
    ledger = new PostgresStockLedgerAdapter(dataSource);
  });

  beforeEach(async () => {
    await resetTestDatabase(dataSource);
    variant = await seedVariant(dataSource, { sku: SNEAKER_SKU, onHand: 10 });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('record', () => {
    it('applies the adjustment and appends the movement with database generated fields', async () => {
      const result = await ledger.record(aLedgerEntry({ quantity: 3 }));

      expect(result).toMatchObject({
        kind: 'Ok',
        value: {
          alreadyRecorded: false,
          movement: {
            sku: SNEAKER_SKU,
            quantity: 3,
            reason: MovementReason.SALE,
            balanceAfter: 7,
            createdBy: OPERATOR,
          },
        },
      });
      expect(unwrap(result).movement.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(unwrap(result).movement.occurredAt).toBeInstanceOf(Date);
      expect(await onHandOf(dataSource, variant.variantId)).toBe(7);
      expect(await movementCountOf(dataSource, variant.variantId)).toBe(1);
    });

    it('increases the stock for inbound reasons', async () => {
      await ledger.record(aLedgerEntry({ quantity: 5, reason: MovementReason.RESTOCK }));

      expect(await onHandOf(dataSource, variant.variantId)).toBe(15);
    });

    it('decreases the stock for a manual decrease adjustment', async () => {
      await ledger.record(
        aLedgerEntry({ quantity: 4, reason: MovementReason.ADJUSTMENT_DECREASE }),
      );

      expect(await onHandOf(dataSource, variant.variantId)).toBe(6);
    });

    it('allows the stock to reach exactly zero', async () => {
      const result = await ledger.record(aLedgerEntry({ quantity: 10 }));

      expect(result).toMatchObject({ kind: 'Ok', value: { movement: { balanceAfter: 0 } } });
    });

    it('rejects an outbound movement larger than the stock without writing anything', async () => {
      const result = await ledger.record(aLedgerEntry({ quantity: 11 }));

      expect(result).toEqual({
        kind: 'InsufficientStock',
        error: { kind: 'InsufficientStock', sku: SNEAKER_SKU, requested: 11, available: 10 },
      });
      expect(await onHandOf(dataSource, variant.variantId)).toBe(10);
      expect(await movementCountOf(dataSource, variant.variantId)).toBe(0);
    });

    it('rejects an unknown variant', async () => {
      const result = await ledger.record(aLedgerEntry({ sku: UNKNOWN_SKU }));

      expect(result).toEqual({
        kind: 'VariantNotFound',
        error: { kind: 'VariantNotFound', sku: UNKNOWN_SKU },
      });
    });

    it('returns the movement already recorded under the key without applying it again', async () => {
      const first = await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));

      const duplicate = await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));

      expect(duplicate).toEqual({
        kind: 'Ok',
        value: { movement: unwrap(first).movement, alreadyRecorded: true },
      });
      expect(await onHandOf(dataSource, variant.variantId)).toBe(9);
      expect(await movementCountOf(dataSource, variant.variantId)).toBe(1);
    });

    it('accepts the same idempotency key from a different creator', async () => {
      await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));

      const result = await ledger.record(
        aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY, createdBy: OTHER_OPERATOR }),
      );

      expect(result.kind).toBe('Ok');
      expect(await onHandOf(dataSource, variant.variantId)).toBe(8);
    });

    it('only touches the targeted variant', async () => {
      const other = await seedVariant(dataSource, { sku: 'SNK-RUN-43-BLK', onHand: 4 });

      await ledger.record(aLedgerEntry({ quantity: 2 }));

      expect(await onHandOf(dataSource, other.variantId)).toBe(4);
    });
  });

  describe('stock capacity', () => {
    it('rejects a restock that would overflow the stock column instead of failing', async () => {
      const full = await seedVariant(dataSource, { sku: 'SNK-FULL', onHand: MAX_STOCK_LEVEL - 10 });

      const result = await ledger.record(
        aLedgerEntry({ sku: 'SNK-FULL', quantity: 100_000, reason: MovementReason.RESTOCK }),
      );

      expect(result).toEqual({
        kind: 'StockCapacityExceeded',
        error: {
          kind: 'StockCapacityExceeded',
          sku: 'SNK-FULL',
          requested: 100_000,
          onHand: MAX_STOCK_LEVEL - 10,
          capacity: MAX_STOCK_LEVEL,
        },
      });
      expect(await onHandOf(dataSource, full.variantId)).toBe(MAX_STOCK_LEVEL - 10);
      expect(await movementCountOf(dataSource, full.variantId)).toBe(0);
    });

    it('accepts a restock that reaches exactly the capacity', async () => {
      await seedVariant(dataSource, { sku: 'SNK-FULL', onHand: MAX_STOCK_LEVEL - 10 });

      const result = await ledger.record(
        aLedgerEntry({ sku: 'SNK-FULL', quantity: 10, reason: MovementReason.RESTOCK }),
      );

      expect(result).toMatchObject({
        kind: 'Ok',
        value: { movement: { balanceAfter: MAX_STOCK_LEVEL } },
      });
    });

    it('still lets outbound movements through on a full variant', async () => {
      await seedVariant(dataSource, { sku: 'SNK-FULL', onHand: MAX_STOCK_LEVEL });

      const result = await ledger.record(aLedgerEntry({ sku: 'SNK-FULL', quantity: 1 }));

      expect(result).toMatchObject({
        kind: 'Ok',
        value: { movement: { balanceAfter: MAX_STOCK_LEVEL - 1 } },
      });
    });
  });

  describe('under concurrency', () => {
    it('never oversells when many buyers race for the last units', async () => {
      const buyers = Array.from({ length: 50 }, () => ledger.record(aLedgerEntry({ quantity: 1 })));

      const results = await Promise.all(buyers);

      const sold = results.filter((result) => result.kind === 'Ok');
      const rejected = results.filter((result) => result.kind === 'InsufficientStock');
      expect(sold).toHaveLength(10);
      expect(rejected).toHaveLength(40);
      expect(await onHandOf(dataSource, variant.variantId)).toBe(0);
      expect(await movementCountOf(dataSource, variant.variantId)).toBe(10);
    });

    it('applies a movement only once when retries with the same key arrive at the same time', async () => {
      const retries = Array.from({ length: 10 }, () =>
        ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY })),
      );

      const results = await Promise.all(retries);

      expect(results.map(wasAlreadyRecorded).filter((replayed) => !replayed)).toHaveLength(1);
      expect(results.filter(wasAlreadyRecorded)).toHaveLength(9);
      expect(await onHandOf(dataSource, variant.variantId)).toBe(9);
    });
  });

  describe('when a rejection races movements that change the stock', () => {
    it('reports the stock it decided on, never more than was requested', async () => {
      for (let round = 0; round < 10; round++) {
        await resetTestDatabase(dataSource);
        await seedVariant(dataSource, { sku: SNEAKER_SKU, onHand: 0 });

        const results = await Promise.all(
          Array.from({ length: 20 }, (_, index) =>
            ledger.record(
              aLedgerEntry({
                quantity: 1,
                reason: index % 2 === 0 ? MovementReason.SALE : MovementReason.RESTOCK,
              }),
            ),
          ),
        );

        const reported = results.flatMap((result) =>
          result.kind === 'InsufficientStock' ? [result.error.available] : [],
        );
        expect(reported.filter((available) => available >= 1)).toEqual([]);
      }
    });
  });

  describe('under mixed concurrent traffic', () => {
    it('keeps the stock equal to the sum of the movements it applied, with no gaps in the ledger', async () => {
      for (let round = 0; round < 10; round++) {
        await resetTestDatabase(dataSource);
        const seeded = await seedVariant(dataSource, { sku: SNEAKER_SKU, onHand: 3 });

        await Promise.all(
          Array.from({ length: 30 }, (_, index) =>
            ledger.record(
              aLedgerEntry({
                quantity: (index % 3) + 1,
                reason: index % 2 === 0 ? MovementReason.SALE : MovementReason.RESTOCK,
              }),
            ),
          ),
        );

        const ledgerRows = await dataSource.query<{ delta: number; balanceAfter: number }[]>(
          `SELECT CASE WHEN reason = 'SALE' THEN -quantity ELSE quantity END AS delta,
                  balance_after AS "balanceAfter"
           FROM stock_movements WHERE variant_id = $1 ORDER BY sequence`,
          [seeded.variantId],
        );
        const replayed = ledgerRows.reduce((balance, row) => {
          expect(row.balanceAfter).toBe(balance + row.delta);
          return row.balanceAfter;
        }, 3);
        expect(await onHandOf(dataSource, seeded.variantId)).toBe(replayed);
      }
    });
  });

  describe('ledger ordering', () => {
    it('orders movements by the sequence in which their balances were applied', async () => {
      await Promise.all(
        Array.from({ length: 10 }, () => ledger.record(aLedgerEntry({ quantity: 1 }))),
      );

      const rows = await dataSource.query<{ balanceAfter: number }[]>(
        'SELECT balance_after AS "balanceAfter" FROM stock_movements WHERE variant_id = $1 ORDER BY sequence',
        [variant.variantId],
      );
      expect(rows.map((row) => row.balanceAfter)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    });
  });

  describe('when a retry races the movement that drained the stock', () => {
    it('returns the recorded movement instead of insufficient stock', async () => {
      const drained = await seedVariant(dataSource, { sku: 'SNK-LAST-ONE', onHand: 1 });

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          ledger.record(aLedgerEntry({ sku: 'SNK-LAST-ONE', idempotencyKey: IDEMPOTENCY_KEY })),
        ),
      );

      expect(results.every((result) => result.kind === 'Ok')).toBe(true);
      expect(results.filter(wasAlreadyRecorded)).toHaveLength(4);
      expect(await onHandOf(dataSource, drained.variantId)).toBe(0);
    });

    it('returns the recorded movement when the key is retried after the stock ran out', async () => {
      await seedVariant(dataSource, { sku: 'SNK-LAST-ONE', onHand: 1 });
      await ledger.record(aLedgerEntry({ sku: 'SNK-LAST-ONE', idempotencyKey: IDEMPOTENCY_KEY }));

      const retry = await ledger.record(
        aLedgerEntry({ sku: 'SNK-LAST-ONE', idempotencyKey: IDEMPOTENCY_KEY }),
      );

      expect(retry).toMatchObject({ kind: 'Ok', value: { alreadyRecorded: true } });
    });
  });

  describe('database invariants', () => {
    it('refuses a negative stock even if application code is bypassed', async () => {
      await expect(
        dataSource.query('UPDATE stock_levels SET on_hand = -1 WHERE variant_id = $1', [
          variant.variantId,
        ]),
      ).rejects.toThrow(/CHK_stock_levels_on_hand_non_negative/);
    });

    it('refuses a duplicated sku', async () => {
      await expect(
        seedVariant(dataSource, { sku: SNEAKER_SKU, onHand: 1, size: '43' }),
      ).rejects.toThrow(/UQ_variants_sku/);
    });

    it('refuses a malformed sku', async () => {
      await expect(seedVariant(dataSource, { sku: 'snk lower', onHand: 1 })).rejects.toThrow(
        /CHK_variants_sku_format/,
      );
    });
  });

  describe('findLevel', () => {
    it('returns the current stock of a variant', async () => {
      expect(await ledger.findLevel(aSku(SNEAKER_SKU))).toEqual({ sku: SNEAKER_SKU, onHand: 10 });
    });

    it('returns null for an unknown variant', async () => {
      expect(await ledger.findLevel(aSku(UNKNOWN_SKU))).toBeNull();
    });
  });
});
