import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/enums/movement-reason';

export function isMovementReason(value: string): value is MovementReason {
  return MOVEMENT_REASONS.some((reason) => reason === value);
}
