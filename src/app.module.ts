import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { EnvironmentModule } from '@infrastructure/config/environment.module';
import { throttlerOptions } from '@infrastructure/config/options/throttler.options';
import { databaseOptions } from '@infrastructure/database/options/database.options';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { JwtScopeGuard } from '@infrastructure/auth/guards/jwt-scope.guard';
import { LoggingModule } from '@infrastructure/logging/logging.module';
import { StockModule } from '@stock/stock.module';

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
    { provide: APP_GUARD, useClass: JwtScopeGuard },
  ],
})
export class AppModule {}
