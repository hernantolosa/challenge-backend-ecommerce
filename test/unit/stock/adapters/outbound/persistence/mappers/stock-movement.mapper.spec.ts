import { toStockMovement } from '@stock/adapters/outbound/persistence/mappers/stock-movement.mapper';
import { type StockMovementRow } from '@stock/adapters/outbound/persistence/rows/stock-movement.row';
import { aStockMovement } from '@test/fixtures/stock.fixtures';

function aRow(overrides: Partial<StockMovementRow> = {}): StockMovementRow {
  return { ...aStockMovement(), ...overrides };
}

describe('toStockMovement', () => {
  it('maps a stored row into a domain movement', () => {
    expect(toStockMovement(aRow())).toEqual(aStockMovement());
  });

  it('refuses a stored reason the domain does not know', () => {
    expect(() => toStockMovement(aRow({ reason: 'THEFT' }))).toThrow(
      'stored movement reason THEFT is unknown',
    );
  });
});
