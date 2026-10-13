import { type MixedList, type EntitySchema } from 'typeorm';

export const ENTITIES: MixedList<string | (new () => object) | EntitySchema> = [];
