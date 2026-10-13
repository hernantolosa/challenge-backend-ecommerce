import { Module } from '@nestjs/common';
import { StockController } from '@stock/adapters/inbound/http/controllers/stock.controller';
import { TypeOrmStockLedgerRepository } from '@stock/adapters/outbound/persistence/repositories/typeorm-stock-ledger.repository';
import { StockLedger } from '@stock/application/ports/stock-ledger.port';
import { StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { GetStockLevel } from '@stock/application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from '@stock/application/use-cases/record-stock-movement.use-case';

@Module({
  controllers: [StockController],
  providers: [
    TypeOrmStockLedgerRepository,
    { provide: StockLedger, useExisting: TypeOrmStockLedgerRepository },
    { provide: StockLevelReader, useExisting: TypeOrmStockLedgerRepository },
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
