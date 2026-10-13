import { type NestExpressApplication } from '@nestjs/platform-express';
import { DataSource } from 'typeorm';
import { MemoryLogDestination } from '@test/fakes/memory-log-destination';
import { Environment, loadEnvironment } from '@config/environment';
import { StockLedger } from '@stock/application/stock-ledger.port';
import { Test } from '@nestjs/testing';
import { LogDestination } from '@shared/logging/log-destination';
import { AppModule } from '@src/app.module';
import { configureApp } from '@src/configure-app';

export interface TestApp {
  readonly app: NestExpressApplication;
  readonly dataSource: DataSource;
  readonly logs: MemoryLogDestination;
}

export interface TestAppOptions {
  readonly stockLedger?: StockLedger;
  readonly environment?: Partial<Environment>;
}

const processLogs = new MemoryLogDestination();

export async function startTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const logs = processLogs;
  logs.clear();
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
