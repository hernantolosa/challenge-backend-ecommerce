import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CatalogModule } from './catalog/catalog.module';
import { Environment } from './config/environment';
import { EnvironmentModule } from './config/environment.module';
import { databaseOptions } from './database/database.options';
import { StockModule } from './stock/stock.module';

function throttlerOptions(environment: Environment): ThrottlerModuleOptions {
  return [{ ttl: environment.THROTTLE_TTL_MS, limit: environment.THROTTLE_LIMIT }];
}

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
