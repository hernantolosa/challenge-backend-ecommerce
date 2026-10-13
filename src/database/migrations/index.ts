import { type MigrationInterface } from 'typeorm';
import { InitialSchema1791920925563 } from './1791920925563-InitialSchema';

export const MIGRATIONS: (new () => MigrationInterface)[] = [InitialSchema1791920925563];
