import { type StockMovementView } from './stock-movement.view';

export interface RecordedStockMovementView {
  readonly movement: StockMovementView;
  readonly replayed: boolean;
}
