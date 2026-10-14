import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';

export interface RecordedMovement {
  readonly movement: StockMovement;
  readonly alreadyRecorded: boolean;
}
