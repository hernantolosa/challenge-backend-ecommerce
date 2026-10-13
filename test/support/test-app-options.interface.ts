import { type StockLedger } from '@stock/application/ports/stock-ledger.port';

export interface TestAppOptions {
  readonly stockLedger?: StockLedger;
}
