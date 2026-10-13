import { Global, Module } from '@nestjs/common';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { AppLogger } from '@infrastructure/logging/logger/app-logger';
import { LogDestination } from '@infrastructure/logging/logger/log-destination';
import { createAppLogger } from '@infrastructure/logging/logger/logger.factory';
import { NestLoggerAdapter } from '@infrastructure/logging/logger/nest-logger.adapter';
import { StdoutLogDestination } from '@infrastructure/logging/logger/stdout-log-destination';
import { TraceContextStore } from '@infrastructure/logging/tracing/trace-context.store';

@Global()
@Module({
  providers: [
    TraceContextStore,
    { provide: LogDestination, useClass: StdoutLogDestination },
    {
      provide: AppLogger,
      inject: [Environment, LogDestination, TraceContextStore],
      useFactory: createAppLogger,
    },
    {
      provide: NestLoggerAdapter,
      inject: [AppLogger],
      useFactory: (logger: AppLogger): NestLoggerAdapter => new NestLoggerAdapter(logger),
    },
  ],
  exports: [TraceContextStore, AppLogger, NestLoggerAdapter],
})
export class LoggingModule {}
