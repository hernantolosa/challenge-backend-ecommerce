import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VariantOrmEntity } from '@catalog/adapters/outbound/persistence/entities/variant.orm-entity';

@Entity({ name: 'stock_levels' })
@Check('CHK_stock_levels_on_hand_non_negative', '"on_hand" >= 0')
export class StockLevelOrmEntity {
  @PrimaryColumn({ name: 'variant_id', type: 'uuid', primaryKeyConstraintName: 'PK_stock_levels' })
  variantId!: string;

  @OneToOne(() => VariantOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_stock_levels_variant' })
  variant?: VariantOrmEntity;

  @Column({ name: 'on_hand', type: 'integer', default: 0 })
  onHand!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
