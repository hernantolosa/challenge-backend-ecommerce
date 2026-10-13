import { toStockMovement } from '@stock/adapters/outbound/persistence/mappers/stock-movement.mapper';
import { aStockMovement, aStockMovementRow } from '@test/fixtures/stock.fixtures';

describe('toStockMovement', () => {
  it('maps a stored row into a domain movement', () => {
    expect(toStockMovement(aStockMovementRow())).toEqual(aStockMovement());
  });

  it('refuses a stored reason the domain does not know', () => {
    expect(() => toStockMovement(aStockMovementRow({ reason: 'THEFT' }))).toThrow(
      'stored movement reason THEFT is unknown',
    );
  });
});
