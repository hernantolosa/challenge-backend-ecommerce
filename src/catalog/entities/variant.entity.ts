import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProductOrmEntity } from './product.entity';

@Entity({ name: 'variants' })
@Unique('UQ_variants_sku', ['sku'])
@Unique('UQ_variants_product_size_color', ['productId', 'size', 'color'])
@Check('CHK_variants_sku_format', `"sku" ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'`)
export class VariantOrmEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_variants' })
  id!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @ManyToOne(() => ProductOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id', foreignKeyConstraintName: 'FK_variants_product' })
  product?: ProductOrmEntity;

  @Column({ type: 'varchar', length: 64 })
  sku!: string;

  @Column({ type: 'varchar', length: 20 })
  size!: string;

  @Column({ type: 'varchar', length: 30 })
  color!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
