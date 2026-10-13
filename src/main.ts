import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { AppLogger } from '@infrastructure/logging/logger/app-logger';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  configureApp(app);

  const { PORT } = app.get(Environment);
  await app.listen(PORT);
  app.get(AppLogger).info('Application started', { port: PORT });
}

void bootstrap();
