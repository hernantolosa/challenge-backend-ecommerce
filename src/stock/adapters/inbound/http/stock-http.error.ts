import { type GetStockLevelError } from '../../../application/errors/get-stock-level.error';
import { type RecordStockMovementError } from '../../../application/errors/record-stock-movement.error';

export type StockHttpError = RecordStockMovementError | GetStockLevelError;
