import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { Environment } from '@config/environment.schema';
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
  app.get(Logger).log(`Application started on port ${PORT}`);
}

void bootstrap();
