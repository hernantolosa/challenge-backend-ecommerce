import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '@shared/database/postgres-errors';
import { Err } from '@shared/result/err';
import { unreachable } from '@shared/result/match';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result.type';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry.interface';
import { type RecordedMovement } from '@stock/application/ports/recorded-movement.interface';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
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

type AdjustmentRow = RejectedAdjustmentRow | AppliedAdjustmentRow;

interface RejectedAdjustmentRow {
  readonly onHand: number;
  readonly id: null;
}

interface AppliedAdjustmentRow {
  readonly onHand: number;
  readonly id: string;
  readonly balanceAfter: number;
  readonly occurredAt: Date;
}

type RecordResult = Result<RecordedMovement, RecordEntryError>;
type RecordRejection = Exclude<RecordResult, Ok<RecordedMovement>>;

interface StockMovementRow extends Omit<StockMovement, 'reason'> {
  readonly reason: string;
}

@Injectable()
export class PostgresStockLedgerAdapter implements StockLedger, StockLevelReader {
  constructor(private readonly dataSource: DataSource) {}

  async record(entry: LedgerEntry): Promise<RecordResult> {
    let row: AdjustmentRow | undefined;
    try {
      [row] = await this.applyAdjustmentAndAppendMovement(entry);
    } catch (error) {
      if (!isUniqueViolation(error, IDEMPOTENCY_CONSTRAINT)) {
        throw error;
      }
      return this.movementRecordedConcurrently(entry);
    }
    return this.outcomeOf(entry, row);
  }

  async findLevel(sku: Sku): Promise<StockLevel | null> {
    const [row] = await this.dataSource.query<StockLevel[]>(FIND_LEVEL_SQL, [sku.value]);
    return row === undefined ? null : { sku: row.sku, onHand: row.onHand };
  }

  private applyAdjustmentAndAppendMovement(entry: LedgerEntry): Promise<AdjustmentRow[]> {
    const { adjustment } = entry;
    return this.dataSource.query<AdjustmentRow[]>(APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL, [
      adjustment.sku.value,
      adjustment.stockDelta,
      adjustment.quantity.value,
      adjustment.reason,
      entry.createdBy,
      entry.idempotencyKey.value,
      MAX_STOCK_LEVEL,
    ]);
  }

  private async outcomeOf(
    entry: LedgerEntry,
    row: AdjustmentRow | undefined,
  ): Promise<RecordResult> {
    if (row === undefined) {
      return this.previousOr(entry, Err.make(VariantNotFound.make(entry.adjustment.sku.value)));
    }
    if (row.id === null) {
      return this.previousOr(entry, entry.adjustment.rejectionAgainst(row.onHand));
    }
    return Ok.make({ movement: toAppliedMovement(entry, row), alreadyRecorded: false });
  }

  private async movementRecordedConcurrently(entry: LedgerEntry): Promise<RecordResult> {
    const winner = await this.findMovement(entry);
    if (winner === null) {
      return unreachable('an idempotency key was taken without a movement');
    }
    return Ok.make({ movement: winner, alreadyRecorded: true });
  }

  private async previousOr(entry: LedgerEntry, rejection: RecordRejection): Promise<RecordResult> {
    const previous = await this.findMovement(entry);
    return previous === null ? rejection : Ok.make({ movement: previous, alreadyRecorded: true });
  }

  private async findMovement(entry: LedgerEntry): Promise<StockMovement | null> {
    const [row] = await this.dataSource.query<StockMovementRow[]>(FIND_MOVEMENT_SQL, [
      entry.createdBy,
      entry.idempotencyKey.value,
    ]);
    return row === undefined ? null : toStoredMovement(row);
  }
}

function toAppliedMovement(entry: LedgerEntry, applied: AppliedAdjustmentRow): StockMovement {
  return {
    id: applied.id,
    sku: entry.adjustment.sku.value,
    quantity: entry.adjustment.quantity.value,
    reason: entry.adjustment.reason,
    balanceAfter: applied.balanceAfter,
    createdBy: entry.createdBy,
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
