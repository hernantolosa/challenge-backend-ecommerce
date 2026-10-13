import { type CatalogVariantSeed } from './catalog-variant-seed.interface';

export interface CatalogProductSeed {
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly variants: readonly CatalogVariantSeed[];
}
