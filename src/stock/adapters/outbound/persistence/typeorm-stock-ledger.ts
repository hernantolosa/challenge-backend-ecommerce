import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '../../../../database/postgres-errors';
import { Err, Ok, type Result } from '../../../../utils/result';
import {
  IdempotencyKeyTaken,
  StockLedger,
  type LedgerEntry,
  type RecordEntryError,
} from '../../../application/ports/stock-ledger.port';
import { type IdempotencyKey } from '../../../domain/idempotency-key';
import { type Sku } from '../../../domain/sku';
import { type StockLevel } from '../../../domain/stock-level';
import { type StockMovement } from '../../../domain/stock-movement';
import { InsufficientStock, VariantNotFound } from '../../../domain/stock.errors';
import { APPLY_ADJUSTMENT_SQL, FIND_LEVEL_SQL, FIND_MOVEMENT_SQL } from './stock-ledger.sql';
import { IDEMPOTENCY_CONSTRAINT } from './stock-movement.orm-entity';

interface AppliedAdjustmentRow {
  readonly id: string;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}

@Injectable()
export class TypeOrmStockLedger extends StockLedger {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    try {
      const [applied] = await this.applyAdjustment(entry);
      if (applied === undefined) return Err.make(await this.explainRejection(entry));

      return Ok.make(toStockMovement(entry, applied));
    } catch (error) {
      if (isUniqueViolation(error, IDEMPOTENCY_CONSTRAINT)) {
        return Err.make(IdempotencyKeyTaken.make());
      }
      throw error;
    }
  }

  async findMovement(actor: string, idempotencyKey: IdempotencyKey): Promise<StockMovement | null> {
    const [movement] = await this.dataSource.query<StockMovement[]>(FIND_MOVEMENT_SQL, [
      actor,
      idempotencyKey.value,
    ]);
    return movement ?? null;
  }

  async findLevel(sku: Sku): Promise<StockLevel | null> {
    const [level] = await this.dataSource.query<StockLevel[]>(FIND_LEVEL_SQL, [sku.value]);
    return level ?? null;
  }

  private applyAdjustment(entry: LedgerEntry): Promise<AppliedAdjustmentRow[]> {
    const { adjustment } = entry;
    return this.dataSource.query<AppliedAdjustmentRow[]>(APPLY_ADJUSTMENT_SQL, [
      adjustment.sku.value,
      adjustment.delta,
      adjustment.quantity.value,
      adjustment.reason,
      entry.actor,
      entry.idempotencyKey.value,
    ]);
  }

  private async explainRejection(entry: LedgerEntry): Promise<VariantNotFound | InsufficientStock> {
    const { sku, quantity } = entry.adjustment;
    const level = await this.findLevel(sku);
    if (level === null) return VariantNotFound.make(sku.value);

    return InsufficientStock.make(sku.value, quantity.value, level.onHand);
  }
}

function toStockMovement(entry: LedgerEntry, applied: AppliedAdjustmentRow): StockMovement {
  return {
    id: applied.id,
    sku: entry.adjustment.sku.value,
    quantity: entry.adjustment.quantity.value,
    reason: entry.adjustment.reason,
    balanceAfter: applied.balanceAfter,
    actor: entry.actor,
    idempotencyKey: entry.idempotencyKey.value,
    occurredAt: applied.occurredAt,
  };
}
