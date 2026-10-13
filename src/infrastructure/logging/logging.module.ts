import { Global, Module } from '@nestjs/common';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { AppLogger } from './logger/app-logger';
import { LogDestination } from './logger/log-destination';
import { createAppLogger } from './logger/logger.factory';
import { NestLoggerAdapter } from './logger/nest-logger.adapter';
import { StdoutLogDestination } from './logger/stdout-log-destination';
import { TraceContextStore } from './tracing/trace-context.store';

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
