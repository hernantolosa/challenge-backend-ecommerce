import { MOVEMENT_REASONS } from '@stock/domain/enums/movement-reason';
import { isMovementReason } from '@stock/domain/guards/movement-reason.guard';

describe('isMovementReason', () => {
  it.each(MOVEMENT_REASONS)('recognizes %s', (reason) => {
    expect(isMovementReason(reason)).toBe(true);
  });

  it.each(['THEFT', 'sale', ''])('rejects %p', (value) => {
    expect(isMovementReason(value)).toBe(false);
  });
});
