import { DataSource, type EntityManager } from 'typeorm';
import { CategoryOrmEntity } from '../src/catalog/adapters/outbound/persistence/category.orm-entity';
import { ProductOrmEntity } from '../src/catalog/adapters/outbound/persistence/product.orm-entity';
import { VariantOrmEntity } from '../src/catalog/adapters/outbound/persistence/variant.orm-entity';
import { loadDatabaseEnvironment } from '../src/config/environment';
import { databaseOptions } from '../src/database/database.options';
import { StockLevelOrmEntity } from '../src/stock/adapters/outbound/persistence/stock-level.orm-entity';

interface VariantSeed {
  readonly sku: string;
  readonly size: string;
  readonly color: string;
  readonly onHand: number;
}

interface ProductSeed {
  readonly category: string;
  readonly name: string;
  readonly description: string;
  readonly priceCents: number;
  readonly variants: readonly VariantSeed[];
}

const CATALOG: readonly ProductSeed[] = [
  {
    category: 'Running',
    name: 'Trail Runner',
    description: 'Lightweight trail running sneaker',
    priceCents: 129_990,
    variants: [
      { sku: 'SNK-TRAIL-41-BLK', size: '41', color: 'black', onHand: 25 },
      { sku: 'SNK-TRAIL-42-BLK', size: '42', color: 'black', onHand: 10 },
      { sku: 'SNK-TRAIL-42-RED', size: '42', color: 'red', onHand: 1 },
    ],
  },
  {
    category: 'Apparel',
    name: 'Tech Tee',
    description: 'Breathable training t-shirt',
    priceCents: 34_990,
    variants: [
      { sku: 'TEE-TECH-M-WHT', size: 'M', color: 'white', onHand: 40 },
      { sku: 'TEE-TECH-L-WHT', size: 'L', color: 'white', onHand: 0 },
    ],
  },
];

async function seedProduct(manager: EntityManager, seed: ProductSeed): Promise<void> {
  await manager.upsert(CategoryOrmEntity, { name: seed.category }, ['name']);
  const category = await manager.findOneByOrFail(CategoryOrmEntity, { name: seed.category });

  const product =
    (await manager.findOneBy(ProductOrmEntity, { name: seed.name, categoryId: category.id })) ??
    (await manager.save(ProductOrmEntity, {
      categoryId: category.id,
      name: seed.name,
      description: seed.description,
      priceCents: seed.priceCents,
    }));

  for (const variant of seed.variants) await seedVariant(manager, product.id, variant);
}

async function seedVariant(
  manager: EntityManager,
  productId: string,
  seed: VariantSeed,
): Promise<void> {
  if (await manager.existsBy(VariantOrmEntity, { sku: seed.sku })) return;

  const variant = await manager.save(VariantOrmEntity, {
    productId,
    sku: seed.sku,
    size: seed.size,
    color: seed.color,
  });
  await manager.save(StockLevelOrmEntity, { variantId: variant.id, onHand: seed.onHand });
}

async function main(): Promise<void> {
  const dataSource = await new DataSource(databaseOptions(loadDatabaseEnvironment())).initialize();
  try {
    await dataSource.transaction(async (manager) => {
      for (const product of CATALOG) await seedProduct(manager, product);
    });
    process.stdout.write(`Seeded ${CATALOG.length} products\n`);
  } finally {
    await dataSource.destroy();
  }
}

void main();
