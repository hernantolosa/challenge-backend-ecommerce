import { CategoryOrmEntity } from '../catalog/adapters/outbound/persistence/category.orm-entity';
import { ProductOrmEntity } from '../catalog/adapters/outbound/persistence/product.orm-entity';
import { VariantOrmEntity } from '../catalog/adapters/outbound/persistence/variant.orm-entity';
import { StockLevelOrmEntity } from '../stock/adapters/outbound/persistence/stock-level.orm-entity';
import { StockMovementOrmEntity } from '../stock/adapters/outbound/persistence/stock-movement.orm-entity';

export const ENTITIES = [
  CategoryOrmEntity,
  ProductOrmEntity,
  VariantOrmEntity,
  StockLevelOrmEntity,
  StockMovementOrmEntity,
];
