import { type StockMovementView } from '@stock/application/dto/stock-movement.view';
import { type MovementReason } from '@stock/domain/enums/movement-reason';

export class StockMovementResponse {
  private constructor(
    readonly id: string,
    readonly sku: string,
    readonly quantity: number,
    readonly reason: MovementReason,
    readonly balanceAfter: number,
    readonly occurredAt: string,
  ) {}

  static from(view: StockMovementView): StockMovementResponse {
    return new StockMovementResponse(
      view.id,
      view.sku,
      view.quantity,
      view.reason,
      view.balanceAfter,
      view.occurredAt.toISOString(),
    );
  }
}
