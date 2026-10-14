import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';

export class RecordStockMovementOutputDto {
  readonly movement!: StockMovement;
  readonly replayed!: boolean;
}
