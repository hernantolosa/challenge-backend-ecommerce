import { type NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { loadEnvironment } from '@infrastructure/config/loaders/load-environment';
import { LogDestination } from '@infrastructure/logging/logger/log-destination';
import { AppModule } from '@src/app.module';
import { configureApp } from '@src/configure-app';
import { StockLedger } from '@stock/application/ports/stock-ledger.port';
import { MemoryLogDestination } from '@test/fakes/memory-log-destination';
import { type TestApp } from '@test/support/interfaces/test-app.interface';
import { type TestAppOptions } from '@test/support/interfaces/test-app-options.interface';

export async function startTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const logs = new MemoryLogDestination();
  const builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(LogDestination)
    .useValue(logs)
    .overrideProvider(Environment)
    .useValue({ ...loadEnvironment(), ...options.environment });
  if (options.stockLedger !== undefined) {
    builder.overrideProvider(StockLedger).useValue(options.stockLedger);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app);
  await app.init();

  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  return { app, dataSource, logs };
}
