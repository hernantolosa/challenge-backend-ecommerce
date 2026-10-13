import { ValidationPipe } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ProblemDetailsFilter } from '@shared/http/problem-details.filter';
import { AppLogger, NestLoggerAdapter } from '@shared/logging/app-logger';
import {
  bindRequestTrace,
  logRequestOnFinish,
  startRequestTrace,
} from '@shared/logging/request-logging.middleware';
import { TraceContextStore } from '@shared/logging/request-tracing';

const MAX_JSON_BODY = '10kb';

export function configureApp(app: NestExpressApplication): void {
  const logger = app.get(AppLogger);

  app.useLogger(app.get(NestLoggerAdapter));
  app.use(startRequestTrace());
  app.use(logRequestOnFinish(logger));
  app.use(helmet());
  app.useBodyParser('json', { limit: MAX_JSON_BODY });
  app.use(bindRequestTrace(app.get(TraceContextStore)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      validateCustomDecorators: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter(logger));
  app.enableShutdownHooks();
}
