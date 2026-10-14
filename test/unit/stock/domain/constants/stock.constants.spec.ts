import { MAX_STOCK_LEVEL, SKU_MAX_LENGTH } from '@stock/domain/constants/stock.constants';

describe('stock constants', () => {
  it('caps stock at the largest PostgreSQL integer', () => {
    expect(MAX_STOCK_LEVEL).toBe(2147483647);
  });

  it('caps a SKU at the width of its column', () => {
    expect(SKU_MAX_LENGTH).toBe(64);
  });
});
