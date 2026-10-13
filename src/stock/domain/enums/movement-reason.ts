import { exhaustiveMatchGuard } from '@utils/exhaustive-match-guard';

export const MovementReason = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  RESTOCK: 'RESTOCK',
  ADJUSTMENT_INCREASE: 'ADJUSTMENT_INCREASE',
  ADJUSTMENT_DECREASE: 'ADJUSTMENT_DECREASE',
} as const;

export type MovementReason = (typeof MovementReason)[keyof typeof MovementReason];

export const MOVEMENT_REASONS: readonly MovementReason[] = Object.values(MovementReason);

export type StockDirection = 1 | -1;

export function directionOf(reason: MovementReason): StockDirection {
  switch (reason) {
    case MovementReason.RETURN:
    case MovementReason.RESTOCK:
    case MovementReason.ADJUSTMENT_INCREASE:
      return 1;
    case MovementReason.SALE:
    case MovementReason.ADJUSTMENT_DECREASE:
      return -1;
    default:
      return exhaustiveMatchGuard(reason);
  }
}
