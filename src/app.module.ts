import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';
import { Environment } from './infrastructure/config/environment';
import { EnvironmentModule } from './infrastructure/config/environment.module';
import { throttlerOptions } from './infrastructure/config/throttler.options';
import { databaseOptions } from './infrastructure/database/database.options';
import { StockModule } from './stock/stock.module';

@Module({
  imports: [
    EnvironmentModule,
    TypeOrmModule.forRootAsync({ inject: [Environment], useFactory: databaseOptions }),
    ThrottlerModule.forRootAsync({ inject: [Environment], useFactory: throttlerOptions }),
    CatalogModule,
    StockModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
