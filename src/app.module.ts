import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { json } from 'express';
import { ThrottlerGuard, ThrottlerModule, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from '@config/environment';
import { EnvironmentModule } from '@config/environment.module';
import { AuthModule } from '@shared/auth/auth.module';
import { JwtAuthGuard } from '@shared/auth/jwt-auth.guard';
import { ProblemDetailsFilter } from '@shared/http/problem-details.filter';
import { databaseOptions } from '@shared/database/database.options';
import { LoggingModule } from '@shared/logging/logging.module';
import { StockModule } from '@stock/stock.module';
import { AppController } from './app.controller';

const MAX_JSON_BODY = '10kb';

function throttlerOptions(environment: Environment): ThrottlerModuleOptions {
  return [{ ttl: environment.THROTTLE_TTL_MS, limit: environment.THROTTLE_LIMIT }];
}

@Module({
  imports: [
    EnvironmentModule,
    LoggingModule,
    AuthModule,
    TypeOrmModule.forRootAsync({ inject: [Environment], useFactory: databaseOptions }),
    ThrottlerModule.forRootAsync({ inject: [Environment], useFactory: throttlerOptions }),
    StockModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(json({ limit: MAX_JSON_BODY })).forRoutes('*');
  }
}
