import { Module } from '@nestjs/common';
import { StockLedger } from './application/ports/stock-ledger.port';
import { GetStockLevel } from './application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from './application/use-cases/record-stock-movement.use-case';
import { TypeOrmStockLedger } from './adapters/outbound/persistence/typeorm-stock-ledger';

@Module({
  providers: [
    { provide: StockLedger, useClass: TypeOrmStockLedger },
    {
      provide: RecordStockMovement,
      inject: [StockLedger],
      useFactory: (ledger: StockLedger): RecordStockMovement => new RecordStockMovement(ledger),
    },
    {
      provide: GetStockLevel,
      inject: [StockLedger],
      useFactory: (ledger: StockLedger): GetStockLevel => new GetStockLevel(ledger),
    },
  ],
})
export class StockModule {}
