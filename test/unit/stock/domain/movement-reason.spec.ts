import { MOVEMENT_REASONS, isMovementReason } from '@stock/domain/movement-reason';

describe('isMovementReason', () => {
  it.each(MOVEMENT_REASONS)('recognizes %s', (reason) => {
    expect(isMovementReason(reason)).toBe(true);
  });

  it.each(['THEFT', 'sale', ''])('rejects %p', (value) => {
    expect(isMovementReason(value)).toBe(false);
  });
});
