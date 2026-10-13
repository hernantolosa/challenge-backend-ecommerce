import { DataSource } from 'typeorm';
import { loadDatabaseEnvironment } from '../config/loaders/load-environment';
import { databaseOptions } from './options/database.options';

export const AppDataSource = new DataSource(databaseOptions(loadDatabaseEnvironment()));
