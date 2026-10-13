import { Module } from '@nestjs/common';
import { GetStockLevel } from '@stock/application/get-stock-level.use-case';
import { RecordStockMovement } from '@stock/application/record-stock-movement.use-case';
import { StockLedger, StockLevelReader } from '@stock/application/stock-ledger.port';
import { StockController } from '@stock/http/stock.controller';
import { PostgresStockLedger } from '@stock/infrastructure/postgres-stock-ledger';

@Module({
  controllers: [StockController],
  providers: [
    PostgresStockLedger,
    { provide: StockLedger, useExisting: PostgresStockLedger },
    { provide: StockLevelReader, useExisting: PostgresStockLedger },
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
