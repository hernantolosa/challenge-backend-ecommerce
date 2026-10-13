import { ValidationPipe } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ProblemDetailsFilter } from '@infrastructure/http/filters/problem-details.filter';
import { AppLogger } from '@infrastructure/logging/logger/app-logger';
import { NestLoggerAdapter } from '@infrastructure/logging/logger/nest-logger.adapter';
import { bindRequestTrace } from '@infrastructure/logging/middlewares/bind-request-trace.middleware';
import { logRequestOnFinish } from '@infrastructure/logging/middlewares/log-request-on-finish.middleware';
import { startRequestTrace } from '@infrastructure/logging/middlewares/start-request-trace.middleware';
import { TraceContextStore } from '@infrastructure/logging/tracing/trace-context.store';

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
