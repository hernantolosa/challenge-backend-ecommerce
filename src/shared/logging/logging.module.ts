import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { Environment } from '@config/environment.schema';
import { LogDestination } from './log-destination';
import { loggerOptions } from './logger.options';
import { PrettyLogDestination } from './pretty-log-destination';
import { StdoutLogDestination } from './stdout-log-destination';

async function logDestinationFor(environment: Environment): Promise<LogDestination> {
  return environment.NODE_ENV === 'development'
    ? PrettyLogDestination.create()
    : new StdoutLogDestination();
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      providers: [
        { provide: LogDestination, inject: [Environment], useFactory: logDestinationFor },
      ],
      inject: [Environment, LogDestination],
      useFactory: loggerOptions,
    }),
  ],
})
export class LoggingModule {}
