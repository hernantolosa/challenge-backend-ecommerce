import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, type ThrottlerModuleOptions } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from '@config/environment';
import { EnvironmentModule } from '@config/environment.module';
import { AuthModule } from '@shared/auth/auth.module';
import { JwtAuthGuard } from '@shared/auth/jwt-auth.guard';
import { databaseOptions } from '@shared/database/database.options';
import { LoggingModule } from '@shared/logging/logging.module';
import { StockModule } from '@stock/stock.module';
import { AppController } from './app.controller';

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
  ],
})
export class AppModule {}
