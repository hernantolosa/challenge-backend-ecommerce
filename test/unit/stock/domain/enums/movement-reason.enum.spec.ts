import { MOVEMENT_REASONS, isMovementReason } from '@stock/domain/enums/movement-reason.enum';

const PUBLISHED_REASONS = [
  'SALE',
  'RETURN',
  'RESTOCK',
  'ADJUSTMENT_INCREASE',
  'ADJUSTMENT_DECREASE',
];

describe('MovementReason', () => {
  it('publishes exactly the reasons the API documents', () => {
    expect([...MOVEMENT_REASONS].sort()).toEqual([...PUBLISHED_REASONS].sort());
  });

  it.each(PUBLISHED_REASONS)('recognizes %s', (reason) => {
    expect(isMovementReason(reason)).toBe(true);
  });

  it.each(['THEFT', 'sale', ''])('rejects %p', (value) => {
    expect(isMovementReason(value)).toBe(false);
  });
});
