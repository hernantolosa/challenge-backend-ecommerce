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
import { VariantOrmEntity } from '@catalog/entities/variant.orm-entity';
import { IDEMPOTENCY_CONSTRAINT } from '@stock/adapters/persistence/stock-ledger.sql';
import { MOVEMENT_REASONS, type MovementReason } from '@stock/domain/enums/movement-reason.enum';

@Entity({ name: 'stock_movements' })
@Unique(IDEMPOTENCY_CONSTRAINT, ['actor', 'idempotencyKey'])
@Index('IDX_stock_movements_variant_sequence', ['variantId', 'sequence'])
@Check('CHK_stock_movements_quantity_positive', '"quantity" > 0')
@Check('CHK_stock_movements_balance_after_non_negative', '"balance_after" >= 0')
@Check(
  'CHK_stock_movements_reason',
  `"reason" IN (${MOVEMENT_REASONS.map((reason) => `'${reason}'`).join(', ')})`,
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

  @Column({ type: 'bigint', generated: 'identity', generatedIdentity: 'ALWAYS' })
  sequence!: string;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;
}
