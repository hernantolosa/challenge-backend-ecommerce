import { type LoggerService } from '@nestjs/common';
import { type AppLogger } from './app-logger';

const BOOTSTRAP_CONTEXTS: ReadonlySet<string> = new Set([
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestFactory',
  'NestApplication',
]);

export class NestLoggerAdapter implements LoggerService {
  constructor(private readonly logger: AppLogger) {}

  log(message: unknown, ...params: unknown[]): void {
    const context = contextOf(params);
    if (BOOTSTRAP_CONTEXTS.has(context)) {
      this.logger.debug(String(message), { context });
      return;
    }
    this.logger.info(String(message), { context });
  }

  error(message: unknown, ...params: unknown[]): void {
    this.logger.error(String(message), stackOf(params), { context: contextOf(params) });
  }

  warn(message: unknown, ...params: unknown[]): void {
    this.logger.warn(String(message), { context: contextOf(params) });
  }

  debug(message: unknown, ...params: unknown[]): void {
    this.logger.debug(String(message), { context: contextOf(params) });
  }

  verbose(message: unknown, ...params: unknown[]): void {
    this.logger.debug(String(message), { context: contextOf(params) });
  }

  fatal(message: unknown, ...params: unknown[]): void {
    this.logger.error(String(message), stackOf(params), { context: contextOf(params) });
  }
}

function contextOf(params: readonly unknown[]): string {
  const last = params.at(-1);
  return typeof last === 'string' ? last : 'Nest';
}

function stackOf(params: readonly unknown[]): string {
  const first = params.at(0);
  return typeof first === 'string' && params.length > 1 ? first : 'No stack available';
}
