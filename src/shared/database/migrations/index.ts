import { type MigrationInterface } from 'typeorm';
import { InitialSchema1791920925563 } from './1791920925563-InitialSchema';
import { OrderMovementsBySequence1791926158770 } from './1791926158770-OrderMovementsBySequence';
import { RenameActorToCreatedBy1791951395284 } from './1791951395284-RenameActorToCreatedBy';

export const MIGRATIONS: (new () => MigrationInterface)[] = [
  InitialSchema1791920925563,
  OrderMovementsBySequence1791926158770,
  RenameActorToCreatedBy1791951395284,
];
