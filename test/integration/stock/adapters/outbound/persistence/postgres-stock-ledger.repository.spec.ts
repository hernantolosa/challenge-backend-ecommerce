import { unwrap } from '@test/support/unwrap';
import { type DataSource } from 'typeorm';
import { PostgresStockLedgerRepository } from '@stock/adapters/outbound/persistence/repositories/postgres-stock-ledger.repository';
import { Sku } from '@stock/domain/value-objects/sku';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock-level.constants';
import { MovementReason } from '@stock/domain/enums/movement-reason';
import {
  movementCountOf,
  onHandOf,
  seedVariant,
  type SeededVariant,
} from '@test/fixtures/catalog.fixtures';
import { aLedgerEntry } from '@test/fixtures/ledger-entry.fixtures';
import {
  ACTOR,
  IDEMPOTENCY_KEY,
  OTHER_ACTOR,
  SNEAKER_SKU,
  UNKNOWN_SKU,
} from '@test/fixtures/stock.fixtures';
import { openTestDatabase, resetTestDatabase } from '@test/support/test-database';

function skuOf(raw: string): Sku {
  return unwrap(Sku.make(raw));
}

describe('PostgresStockLedgerRepository', () => {
  let dataSource: DataSource;
  let ledger: PostgresStockLedgerRepository;
  let variant: SeededVariant;

  beforeAll(async () => {
    dataSource = await openTestDatabase();
    ledger = new PostgresStockLedgerRepository(dataSource);
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
          sku: SNEAKER_SKU,
          quantity: 3,
          reason: MovementReason.SALE,
          balanceAfter: 7,
          actor: ACTOR,
        },
      });
      expect(unwrap(result).id).toMatch(/^[0-9a-f-]{36}$/);
      expect(unwrap(result).occurredAt).toBeInstanceOf(Date);
      expect(await onHandOf(dataSource, variant.variantId)).toBe(7);
      expect(await movementCountOf(dataSource, variant.variantId)).toBe(1);
    });

    it('increases the stock for inbound reasons', async () => {
      await ledger.record(aLedgerEntry({ quantity: 5, reason: MovementReason.RESTOCK }));

      expect(await onHandOf(dataSource, variant.variantId)).toBe(15);
    });

    it('allows the stock to reach exactly zero', async () => {
      const result = await ledger.record(aLedgerEntry({ quantity: 10 }));

      expect(result).toMatchObject({ kind: 'Ok', value: { balanceAfter: 0 } });
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

    it('reports a taken idempotency key and rolls back the stock change', async () => {
      await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));

      const duplicate = await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));

      expect(duplicate).toEqual({
        kind: 'IdempotencyKeyTaken',
        error: { kind: 'IdempotencyKeyTaken' },
      });
      expect(await onHandOf(dataSource, variant.variantId)).toBe(9);
      expect(await movementCountOf(dataSource, variant.variantId)).toBe(1);
    });

    it('accepts the same idempotency key from a different actor', async () => {
      await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));

      const result = await ledger.record(
        aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY, actor: OTHER_ACTOR }),
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

      expect(result).toMatchObject({ kind: 'Ok', value: { balanceAfter: MAX_STOCK_LEVEL } });
    });

    it('still lets outbound movements through on a full variant', async () => {
      await seedVariant(dataSource, { sku: 'SNK-FULL', onHand: MAX_STOCK_LEVEL });

      const result = await ledger.record(aLedgerEntry({ sku: 'SNK-FULL', quantity: 1 }));

      expect(result).toMatchObject({ kind: 'Ok', value: { balanceAfter: MAX_STOCK_LEVEL - 1 } });
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

    it('records a gapless balance history when concurrent movements succeed', async () => {
      const buyers = Array.from({ length: 10 }, () => ledger.record(aLedgerEntry({ quantity: 1 })));

      const results = await Promise.all(buyers);

      const balances = results.flatMap((result) =>
        result.kind === 'Ok' ? [result.value.balanceAfter] : [],
      );
      expect([...balances].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('applies a movement only once when retries with the same key arrive at the same time', async () => {
      const retries = Array.from({ length: 10 }, () =>
        ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY })),
      );

      const results = await Promise.all(retries);

      expect(results.filter((result) => result.kind === 'Ok')).toHaveLength(1);
      expect(results.filter((result) => result.kind === 'IdempotencyKeyTaken')).toHaveLength(9);
      expect(await onHandOf(dataSource, variant.variantId)).toBe(9);
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
    it('reports the key as taken instead of insufficient stock', async () => {
      const drained = await seedVariant(dataSource, { sku: 'SNK-LAST-ONE', onHand: 1 });

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          ledger.record(aLedgerEntry({ sku: 'SNK-LAST-ONE', idempotencyKey: IDEMPOTENCY_KEY })),
        ),
      );

      expect(results.filter((result) => result.kind === 'Ok')).toHaveLength(1);
      expect(results.filter((result) => result.kind === 'IdempotencyKeyTaken')).toHaveLength(4);
      expect(await onHandOf(dataSource, drained.variantId)).toBe(0);
    });

    it('reports the key as taken when the same key is retried after the stock ran out', async () => {
      await seedVariant(dataSource, { sku: 'SNK-LAST-ONE', onHand: 1 });
      await ledger.record(aLedgerEntry({ sku: 'SNK-LAST-ONE', idempotencyKey: IDEMPOTENCY_KEY }));

      const retry = await ledger.record(
        aLedgerEntry({ sku: 'SNK-LAST-ONE', idempotencyKey: IDEMPOTENCY_KEY }),
      );

      expect(retry).toEqual({
        kind: 'IdempotencyKeyTaken',
        error: { kind: 'IdempotencyKeyTaken' },
      });
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

  describe('findMovement', () => {
    it('finds a movement by actor and idempotency key', async () => {
      const recorded = await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));
      const idempotencyKey = aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }).idempotencyKey;

      const found = await ledger.findMovement(ACTOR, idempotencyKey);

      expect(found).toEqual(unwrap(recorded));
    });

    it('does not reveal a movement to another actor', async () => {
      await ledger.record(aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }));
      const idempotencyKey = aLedgerEntry({ idempotencyKey: IDEMPOTENCY_KEY }).idempotencyKey;

      expect(await ledger.findMovement(OTHER_ACTOR, idempotencyKey)).toBeNull();
    });
  });

  describe('findLevel', () => {
    it('returns the current stock of a variant', async () => {
      expect(await ledger.findLevel(skuOf(SNEAKER_SKU))).toEqual({ sku: SNEAKER_SKU, onHand: 10 });
    });

    it('returns null for an unknown variant', async () => {
      expect(await ledger.findLevel(skuOf(UNKNOWN_SKU))).toBeNull();
    });
  });
});
