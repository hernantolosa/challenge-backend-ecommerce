import { DataSource } from 'typeorm';
import { loadDatabaseEnvironment } from '@config/environment';
import { databaseOptions } from './database.options';

export const AppDataSource = new DataSource(databaseOptions(loadDatabaseEnvironment()));
