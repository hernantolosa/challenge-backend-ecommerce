import { type Environment } from '@infrastructure/config/schemas/environment.schema';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';

export interface TestAppOptions {
  readonly stockLedger?: StockLedger;
  readonly environment?: Partial<Environment>;
}
