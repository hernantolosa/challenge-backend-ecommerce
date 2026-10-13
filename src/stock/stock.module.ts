import { Module } from '@nestjs/common';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { StockController } from './adapters/inbound/http/controllers/stock.controller';
import { TypeOrmStockLedger } from './adapters/outbound/persistence/repositories/typeorm-stock-ledger.repository';
import { StockLedger } from './application/ports/stock-ledger.port';
import { StockLevelReader } from './application/ports/stock-level-reader.port';
import { GetStockLevel } from './application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from './application/use-cases/record-stock-movement.use-case';

@Module({
  imports: [AuthModule],
  controllers: [StockController],
  providers: [
    TypeOrmStockLedger,
    { provide: StockLedger, useExisting: TypeOrmStockLedger },
    { provide: StockLevelReader, useExisting: TypeOrmStockLedger },
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
