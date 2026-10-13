import { Global, Module } from '@nestjs/common';
import { Environment } from '@config/environment';
import { AppLogger, createPinoLogger, NestLoggerAdapter } from './app-logger';
import { LogDestination, StdoutLogDestination } from './log-destination';
import { TraceContextStore } from './request-tracing';

const SERVICE_NAME = 'ecommerce-api';

function createAppLogger(
  environment: Environment,
  destination: LogDestination,
  traces: TraceContextStore,
): AppLogger {
  const options = {
    level: environment.LOG_LEVEL,
    service: SERVICE_NAME,
    environment: environment.NODE_ENV,
  };
  return new AppLogger(createPinoLogger(options, destination, traces));
}

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
