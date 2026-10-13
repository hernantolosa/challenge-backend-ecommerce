import { type DataSource } from 'typeorm';
import { PostgresStockLedger } from '@stock/infrastructure/postgres-stock-ledger';
import { RecordStockMovement } from '@stock/application/record-stock-movement.use-case';
import { onHandOf, seedVariant, type SeededVariant } from '@test/fixtures/catalog.fixtures';
import { aRecordCommand, SNEAKER_SKU } from '@test/fixtures/stock.fixtures';
import { openTestDatabase, resetTestDatabase } from '@test/support/test-database';

const CONCURRENT_RETRIES = 5;
const ROUNDS = 10;

describe('RecordStockMovement against PostgreSQL', () => {
  let dataSource: DataSource;
  let recordStockMovement: RecordStockMovement;
  let variant: SeededVariant;

  beforeAll(async () => {
    dataSource = await openTestDatabase();
    recordStockMovement = new RecordStockMovement(new PostgresStockLedger(dataSource));
  });

  beforeEach(async () => {
    await resetTestDatabase(dataSource);
    variant = await seedVariant(dataSource, { sku: SNEAKER_SKU, onHand: 1 });
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('applies the last unit once and replays every concurrent retry of the same request', async () => {
    for (let round = 0; round < ROUNDS; round++) {
      await resetTestDatabase(dataSource);
      variant = await seedVariant(dataSource, { sku: SNEAKER_SKU, onHand: 1 });

      const outcomes = await Promise.all(
        Array.from({ length: CONCURRENT_RETRIES }, () =>
          recordStockMovement.execute(aRecordCommand({ quantity: 1 })),
        ),
      );

      const replays = outcomes.map((outcome) => outcome.kind === 'Ok' && outcome.value.replayed);
      expect(outcomes.every((outcome) => outcome.kind === 'Ok')).toBe(true);
      expect(replays.filter((replayed) => !replayed)).toHaveLength(1);
      expect(await onHandOf(dataSource, variant.variantId)).toBe(0);
    }
  });

  it('rejects concurrent reuses of a key with a different request once the first one drains the stock', async () => {
    const outcomes = await Promise.all([
      recordStockMovement.execute(aRecordCommand({ quantity: 1 })),
      recordStockMovement.execute(aRecordCommand({ quantity: 1 })),
      recordStockMovement.execute(aRecordCommand({ quantity: 2 })),
    ]);

    const kinds = outcomes.map((outcome) => outcome.kind);
    expect(kinds.filter((kind) => kind === 'Ok')).toHaveLength(2);
    expect(kinds.filter((kind) => kind === 'IdempotencyKeyReused')).toHaveLength(1);
  });
});
