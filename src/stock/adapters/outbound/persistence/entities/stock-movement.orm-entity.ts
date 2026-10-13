import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { VariantOrmEntity } from '../../../../../catalog/adapters/outbound/persistence/entities/variant.orm-entity';
import { type MovementReason } from '../../../../domain/enums/movement-reason';

export const IDEMPOTENCY_CONSTRAINT = 'UQ_stock_movements_actor_idempotency_key';

@Entity({ name: 'stock_movements' })
@Unique(IDEMPOTENCY_CONSTRAINT, ['actor', 'idempotencyKey'])
@Index('IDX_stock_movements_variant_occurred_at', ['variantId', 'occurredAt'])
@Check('CHK_stock_movements_quantity_positive', '"quantity" > 0')
@Check('CHK_stock_movements_balance_after_non_negative', '"balance_after" >= 0')
@Check(
  'CHK_stock_movements_reason',
  `"reason" IN ('SALE', 'RETURN', 'RESTOCK', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE')`,
)
export class StockMovementOrmEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_stock_movements' })
  id!: string;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId!: string;

  @ManyToOne(() => VariantOrmEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'variant_id', foreignKeyConstraintName: 'FK_stock_movements_variant' })
  variant?: VariantOrmEntity;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'varchar', length: 32 })
  reason!: MovementReason;

  @Column({ name: 'balance_after', type: 'integer' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 255 })
  actor!: string;

  @Column({ name: 'idempotency_key', type: 'uuid' })
  idempotencyKey!: string;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;
}
