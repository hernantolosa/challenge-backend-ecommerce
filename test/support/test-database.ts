import { DataSource } from 'typeorm';
import { loadDatabaseEnvironment } from '@config/load-environment';
import { databaseOptions } from '@shared/database/database.options';

const TABLES = ['stock_movements', 'stock_levels', 'variants', 'products', 'categories'];

export async function openTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource(databaseOptions(loadDatabaseEnvironment()));
  await dataSource.initialize();
  await dataSource.runMigrations();
  return dataSource;
}

export async function resetTestDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);
}
