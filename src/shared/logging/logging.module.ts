import { Module } from '@nestjs/common';
import { LoggerModule, type Params } from 'nestjs-pino';
import { pinoHttp, type HttpLogger } from 'pino-http';
import { type PrettyOptions } from 'pino-pretty';
import { Environment } from '@config/environment.schema';
import { HTTP_LOGGER } from './http-logger.token';
import { LogDestination } from './log-destination';
import { httpLoggerOptions } from './logger.options';

const PRETTY_OPTIONS: PrettyOptions = {
  colorize: true,
  messageKey: 'message',
  translateTime: 'SYS:HH:MM:ss.l',
  ignore: 'service,environment,spanId,parentSpanId',
  singleLine: true,
};

async function logDestinationFor(environment: Environment): Promise<LogDestination> {
  if (environment.NODE_ENV !== 'development') return process.stdout;
  const { build } = await import('pino-pretty');
  return build(PRETTY_OPTIONS);
}

function httpLoggerFor(environment: Environment, destination: LogDestination): HttpLogger {
  return pinoHttp(httpLoggerOptions(environment), destination);
}

function loggerModuleParams(httpLogger: HttpLogger): Params {
  return { useExisting: true, pinoHttp: { logger: httpLogger.logger, wrapSerializers: false } };
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      providers: [
        { provide: LogDestination, inject: [Environment], useFactory: logDestinationFor },
        { provide: HTTP_LOGGER, inject: [Environment, LogDestination], useFactory: httpLoggerFor },
      ],
      inject: [HTTP_LOGGER],
      useFactory: loggerModuleParams,
    }),
  ],
})
export class LoggingModule {}
