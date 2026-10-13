import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryOrmEntity } from './category.entity';

@Entity({ name: 'products' })
@Check('CHK_products_price_cents_non_negative', '"price_cents" >= 0')
export class ProductOrmEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_products' })
  id!: string;

  @Index('IDX_products_category_id')
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @ManyToOne(() => CategoryOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id', foreignKeyConstraintName: 'FK_products_category' })
  category?: CategoryOrmEntity;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'price_cents', type: 'integer' })
  priceCents!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
