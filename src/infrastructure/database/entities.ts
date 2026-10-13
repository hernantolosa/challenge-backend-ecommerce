import { CategoryOrmEntity } from '@catalog/adapters/outbound/persistence/entities/category.orm-entity';
import { ProductOrmEntity } from '@catalog/adapters/outbound/persistence/entities/product.orm-entity';
import { VariantOrmEntity } from '@catalog/adapters/outbound/persistence/entities/variant.orm-entity';
import { StockLevelOrmEntity } from '@stock/adapters/outbound/persistence/entities/stock-level.orm-entity';
import { StockMovementOrmEntity } from '@stock/adapters/outbound/persistence/entities/stock-movement.orm-entity';

export const ENTITIES = [
  CategoryOrmEntity,
  ProductOrmEntity,
  VariantOrmEntity,
  StockLevelOrmEntity,
  StockMovementOrmEntity,
];
