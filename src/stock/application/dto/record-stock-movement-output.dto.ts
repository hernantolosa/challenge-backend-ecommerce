import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';

export interface RecordStockMovementOutputDto {
  readonly movement: StockMovement;
  readonly replayed: boolean;
}
