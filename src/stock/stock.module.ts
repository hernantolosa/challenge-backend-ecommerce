import { Module } from '@nestjs/common';
import { StockController } from '@stock/adapters/http/stock.controller';
import { PostgresStockLedgerAdapter } from '@stock/adapters/persistence/postgres-stock-ledger.adapter';
import { StockLedger } from '@stock/application/ports/stock-ledger.port';
import { StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { GetStockLevel } from '@stock/application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from '@stock/application/use-cases/record-stock-movement.use-case';

@Module({
  controllers: [StockController],
  providers: [
    PostgresStockLedgerAdapter,
    { provide: StockLedger, useExisting: PostgresStockLedgerAdapter },
    { provide: StockLevelReader, useExisting: PostgresStockLedgerAdapter },
    {
      provide: RecordStockMovement,
      inject: [StockLedger],
      useFactory: (ledger: StockLedger): RecordStockMovement => new RecordStockMovement(ledger),
    },
    {
      provide: GetStockLevel,
      inject: [StockLevelReader],
      useFactory: (levels: StockLevelReader): GetStockLevel => new GetStockLevel(levels),
    },
  ],
})
export class StockModule {}
