import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { Environment } from '@config/environment.schema';
import { LogDestination } from './log-destination';
import { loggerOptions } from './logger.options';
import { StdoutLogDestination } from './stdout-log-destination';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      providers: [{ provide: LogDestination, useClass: StdoutLogDestination }],
      inject: [Environment, LogDestination],
      useFactory: loggerOptions,
    }),
  ],
})
export class LoggingModule {}
