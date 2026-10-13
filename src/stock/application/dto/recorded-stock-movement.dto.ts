import { type StockMovementDto } from './stock-movement.dto';

export interface RecordedStockMovementDto {
  readonly movement: StockMovementDto;
  readonly replayed: boolean;
}
