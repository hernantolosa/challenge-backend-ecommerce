import { DataSource } from 'typeorm';
import { loadDatabaseEnvironment } from '@infrastructure/config/loaders/load-environment';
import { databaseOptions } from '@infrastructure/database/options/database.options';

export const AppDataSource = new DataSource(databaseOptions(loadDatabaseEnvironment()));
