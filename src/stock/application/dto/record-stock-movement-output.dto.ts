import { type StockMovement } from '@stock/domain/stock-movement';

export interface RecordStockMovementOutputDto {
  readonly movement: StockMovement;
  readonly replayed: boolean;
}
