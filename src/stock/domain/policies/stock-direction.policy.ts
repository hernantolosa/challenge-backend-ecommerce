import { MovementReason } from '@stock/domain/enums/movement-reason';
import { type StockDirection } from '@stock/domain/types/stock-direction.type';
import { exhaustiveMatchGuard } from '@utils/exhaustive-match-guard';

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
