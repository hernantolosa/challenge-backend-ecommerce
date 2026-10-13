import { randomUUID } from 'node:crypto';
import { type DataSource } from 'typeorm';
import { CategoryOrmEntity } from '@catalog/adapters/outbound/persistence/entities/category.orm-entity';
import { ProductOrmEntity } from '@catalog/adapters/outbound/persistence/entities/product.orm-entity';
import { VariantOrmEntity } from '@catalog/adapters/outbound/persistence/entities/variant.orm-entity';
import { type SeededVariant } from '@test/fixtures/interfaces/seeded-variant.interface';
import { type VariantSeed } from '@test/fixtures/interfaces/variant-seed.interface';
import { StockLevelOrmEntity } from '@stock/adapters/outbound/persistence/entities/stock-level.orm-entity';

export async function seedVariant(
  dataSource: DataSource,
  seed: VariantSeed,
): Promise<SeededVariant> {
  return dataSource.transaction(async (manager) => {
    const category = await manager.save(CategoryOrmEntity, { name: `Running ${randomUUID()}` });
    const product = await manager.save(ProductOrmEntity, {
      categoryId: category.id,
      name: 'Trail Runner',
      description: 'Lightweight trail running sneaker',
      priceCents: 129_990,
    });
    const variant = await manager.save(VariantOrmEntity, {
      productId: product.id,
      sku: seed.sku,
      size: seed.size ?? '42',
      color: seed.color ?? 'black',
    });
    await manager.save(StockLevelOrmEntity, { variantId: variant.id, onHand: seed.onHand });

    return { variantId: variant.id, sku: variant.sku };
  });
}

export async function onHandOf(dataSource: DataSource, variantId: string): Promise<number> {
  const level = await dataSource.manager.findOneByOrFail(StockLevelOrmEntity, { variantId });
  return level.onHand;
}

export async function movementCountOf(dataSource: DataSource, variantId: string): Promise<number> {
  const [row] = await dataSource.query<{ count: number }[]>(
    'SELECT count(*)::int AS count FROM stock_movements WHERE variant_id = $1',
    [variantId],
  );
  return row?.count ?? 0;
}
