import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { Environment } from './config/environment';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app);

  const { PORT } = app.get(Environment);
  await app.listen(PORT);
  new Logger('Bootstrap').log(`App running on port ${PORT}`);
}

void bootstrap();
