import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '@shared/database/postgres-errors';
import { Err, Ok, unreachable, type Result } from '@shared/result';
import {
  IdempotencyKeyTaken,
  type LedgerEntry,
  type RecordEntryError,
  type StockLedger,
  type StockLevelReader,
} from '@stock/application/stock-ledger.port';
import { type IdempotencyKey } from '@stock/domain/idempotency-key';
import { isMovementReason } from '@stock/domain/movement-reason';
import { type Sku } from '@stock/domain/sku';
import { MAX_STOCK_LEVEL } from '@stock/domain/stock.constants';
import { VariantNotFound } from '@stock/domain/stock.errors';
import { type StockLevel, type StockMovement } from '@stock/domain/stock-movement';
import {
  APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL,
  FIND_LEVEL_SQL,
  FIND_MOVEMENT_SQL,
} from './stock-ledger.sql';
import { IDEMPOTENCY_CONSTRAINT } from './stock.entities';

interface AppliedAdjustmentRow {
  readonly id: string;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}

interface StockMovementRow extends Omit<StockMovement, 'reason'> {
  readonly reason: string;
}

@Injectable()
export class PostgresStockLedger implements StockLedger, StockLevelReader {
  constructor(private readonly dataSource: DataSource) {}

  async record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    try {
      const [applied] = await this.applyAdjustmentAndAppendMovement(entry);
      if (applied === undefined) return this.rejectionReasonFor(entry);

      return Ok.make(toAppliedMovement(entry, applied));
    } catch (error) {
      if (isUniqueViolation(error, IDEMPOTENCY_CONSTRAINT))
        return Err.make(IdempotencyKeyTaken.make());
      throw error;
    }
  }

  async findMovement(actor: string, idempotencyKey: IdempotencyKey): Promise<StockMovement | null> {
    const [row] = await this.dataSource.query<StockMovementRow[]>(FIND_MOVEMENT_SQL, [
      actor,
      idempotencyKey.value,
    ]);
    return row === undefined ? null : toStoredMovement(row);
  }

  async findLevel(sku: Sku): Promise<StockLevel | null> {
    const [row] = await this.dataSource.query<StockLevel[]>(FIND_LEVEL_SQL, [sku.value]);
    return row === undefined ? null : { sku: row.sku, onHand: row.onHand };
  }

  private applyAdjustmentAndAppendMovement(entry: LedgerEntry): Promise<AppliedAdjustmentRow[]> {
    const { adjustment } = entry;
    return this.dataSource.query<AppliedAdjustmentRow[]>(APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL, [
      adjustment.sku.value,
      adjustment.stockDelta,
      adjustment.quantity.value,
      adjustment.reason,
      entry.actor,
      entry.idempotencyKey.value,
      MAX_STOCK_LEVEL,
    ]);
  }

  private async rejectionReasonFor(
    entry: LedgerEntry,
  ): Promise<Result<StockMovement, RecordEntryError>> {
    const previous = await this.findMovement(entry.actor, entry.idempotencyKey);
    if (previous !== null) return Err.make(IdempotencyKeyTaken.make());

    const level = await this.findLevel(entry.adjustment.sku);
    if (level === null) return Err.make(VariantNotFound.make(entry.adjustment.sku.value));

    return entry.adjustment.rejectionAgainst(level.onHand);
  }
}

function toAppliedMovement(entry: LedgerEntry, applied: AppliedAdjustmentRow): StockMovement {
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

function toStoredMovement(row: StockMovementRow): StockMovement {
  const { reason } = row;
  return {
    ...row,
    reason: isMovementReason(reason)
      ? reason
      : unreachable(`stored movement reason ${reason} is unknown`),
  };
}
