import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CatalogModule } from '@catalog/catalog.module';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { EnvironmentModule } from '@infrastructure/config/environment.module';
import { throttlerOptions } from '@infrastructure/config/options/throttler.options';
import { databaseOptions } from '@infrastructure/database/options/database.options';
import { LoggingModule } from '@infrastructure/logging/logging.module';
import { StockModule } from '@stock/stock.module';

@Module({
  imports: [
    EnvironmentModule,
    LoggingModule,
    TypeOrmModule.forRootAsync({ inject: [Environment], useFactory: databaseOptions }),
    ThrottlerModule.forRootAsync({ inject: [Environment], useFactory: throttlerOptions }),
    CatalogModule,
    StockModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
