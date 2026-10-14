import { ValidationPipe } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { type HttpLogger } from 'pino-http';
import { HTTP_LOGGER } from '@shared/logging/http-logger.token';

export function configureApp(app: NestExpressApplication): void {
  app.useLogger(app.get(Logger));
  app.use(app.get<symbol, HttpLogger>(HTTP_LOGGER));
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: true,
      validateCustomDecorators: true,
    }),
  );
  app.enableShutdownHooks();
}
