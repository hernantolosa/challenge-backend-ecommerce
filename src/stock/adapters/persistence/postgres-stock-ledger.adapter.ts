import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '@shared/database/postgres-errors';
import { Err } from '@shared/result/err';
import { unreachable } from '@shared/result/match';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result.type';
import { IdempotencyKeyTaken } from '@stock/application/errors/idempotency-key-taken.error';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry.interface';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key.value-object';
import { isMovementReason } from '@stock/domain/enums/movement-reason.enum';
import { type Sku } from '@stock/domain/value-objects/sku.value-object';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock.constants';
import { type StockLevel } from '@stock/domain/entities/stock-level.entity';
import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';
import {
  APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL,
  FIND_LEVEL_SQL,
  FIND_MOVEMENT_SQL,
  IDEMPOTENCY_CONSTRAINT,
} from './stock-ledger.sql';

interface AppliedAdjustmentRow {
  readonly id: string;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}

interface StockMovementRow extends Omit<StockMovement, 'reason'> {
  readonly reason: string;
}

@Injectable()
export class PostgresStockLedgerAdapter implements StockLedger, StockLevelReader {
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
