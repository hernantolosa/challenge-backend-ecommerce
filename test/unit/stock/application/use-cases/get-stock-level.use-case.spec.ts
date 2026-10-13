import { GetStockLevel } from '../../../../../src/stock/application/use-cases/get-stock-level.use-case';
import { InMemoryStockLedger } from '../../../../fakes/in-memory-stock-ledger';
import { SNEAKER_SKU, UNKNOWN_SKU } from '../../../../fixtures/stock.fixtures';

describe('GetStockLevel', () => {
  let getStockLevel: GetStockLevel;

  beforeEach(() => {
    getStockLevel = new GetStockLevel(new InMemoryStockLedger().withStock(SNEAKER_SKU, 4));
  });

  it('returns the stock available for a variant', async () => {
    expect(await getStockLevel.execute(SNEAKER_SKU)).toEqual({
      kind: 'Ok',
      value: { sku: SNEAKER_SKU, onHand: 4 },
    });
  });

  it('normalizes the sku before looking it up', async () => {
    expect(await getStockLevel.execute(` ${SNEAKER_SKU.toLowerCase()} `)).toMatchObject({
      kind: 'Ok',
      value: { onHand: 4 },
    });
  });

  it('reports an unknown variant', async () => {
    expect(await getStockLevel.execute(UNKNOWN_SKU)).toEqual({
      kind: 'VariantNotFound',
      error: { kind: 'VariantNotFound', sku: UNKNOWN_SKU },
    });
  });

  it('rejects an invalid sku', async () => {
    expect(await getStockLevel.execute('NOT A SKU')).toMatchObject({
      kind: 'InvariantViolated',
      error: { kind: 'InvariantViolated', field: 'sku' },
    });
  });
});
