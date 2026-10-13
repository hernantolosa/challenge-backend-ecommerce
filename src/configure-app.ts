import { ValidationPipe } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { ProblemDetailsFilter } from '@infrastructure/http/filters/problem-details.filter';

const MAX_JSON_BODY = '10kb';

export function configureApp(app: NestExpressApplication): void {
  app.use(helmet());
  app.useBodyParser('json', { limit: MAX_JSON_BODY });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.enableShutdownHooks();
}
