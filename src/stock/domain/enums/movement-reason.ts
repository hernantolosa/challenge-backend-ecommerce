export const MovementReason = {
  SALE: 'SALE',
  RETURN: 'RETURN',
  RESTOCK: 'RESTOCK',
  ADJUSTMENT_INCREASE: 'ADJUSTMENT_INCREASE',
  ADJUSTMENT_DECREASE: 'ADJUSTMENT_DECREASE',
} as const;

export type MovementReason = (typeof MovementReason)[keyof typeof MovementReason];

export const MOVEMENT_REASONS: readonly MovementReason[] = Object.values(MovementReason);
