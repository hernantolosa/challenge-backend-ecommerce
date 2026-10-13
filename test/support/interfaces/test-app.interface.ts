import { type NestExpressApplication } from '@nestjs/platform-express';
import { type DataSource } from 'typeorm';
import { type MemoryLogDestination } from '@test/fakes/memory-log-destination';

export interface TestApp {
  readonly app: NestExpressApplication;
  readonly dataSource: DataSource;
  readonly logs: MemoryLogDestination;
}
