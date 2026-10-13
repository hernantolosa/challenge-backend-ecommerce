import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '../../../../../infrastructure/database/errors/postgres-errors';
import { Err } from '../../../../../utils/result/err';
import { Ok } from '../../../../../utils/result/ok';
import { type Result } from '../../../../../utils/result/types/result.type';
import { IdempotencyKeyTaken } from '../../../../application/errors/idempotency-key-taken.error';
import { type RecordEntryError } from '../../../../application/errors/record-entry.error';
import { type LedgerEntry } from '../../../../application/interfaces/ledger-entry.interface';
import { type StockLedger } from '../../../../application/ports/stock-ledger.port';
import { type StockLevelReader } from '../../../../application/ports/stock-level-reader.port';
import { InsufficientStock } from '../../../../domain/errors/insufficient-stock.error';
import { VariantNotFound } from '../../../../domain/errors/variant-not-found.error';
import { type StockLevel } from '../../../../domain/interfaces/stock-level.interface';
import { type StockMovement } from '../../../../domain/interfaces/stock-movement.interface';
import { type IdempotencyKey } from '../../../../domain/value-objects/idempotency-key';
import { type Sku } from '../../../../domain/value-objects/sku';
import { type AppliedAdjustmentRow } from '../rows/applied-adjustment.row';
import {
  APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL,
  FIND_LEVEL_SQL,
  FIND_MOVEMENT_SQL,
} from '../queries/stock-ledger.queries';
import { toStockMovementFromAppliedRow } from '../mappers/stock-movement.mapper';
import { IDEMPOTENCY_CONSTRAINT } from '../entities/stock-movement.orm-entity';

@Injectable()
export class TypeOrmStockLedgerRepository implements StockLedger, StockLevelReader {
  constructor(private readonly dataSource: DataSource) {}

  async record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    try {
      const [applied] = await this.applyAdjustmentAndAppendMovement(entry);
      if (applied === undefined) return this.rejectionReasonFor(entry);

      return Ok.make(toStockMovementFromAppliedRow(entry, applied));
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

  private applyAdjustmentAndAppendMovement(entry: LedgerEntry): Promise<AppliedAdjustmentRow[]> {
    const { adjustment } = entry;
    return this.dataSource.query<AppliedAdjustmentRow[]>(APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL, [
      adjustment.sku.value,
      adjustment.stockDelta,
      adjustment.quantity.value,
      adjustment.reason,
      entry.actor,
      entry.idempotencyKey.value,
    ]);
  }

  private async rejectionReasonFor(
    entry: LedgerEntry,
  ): Promise<Err<VariantNotFound> | Err<InsufficientStock>> {
    const { sku, quantity } = entry.adjustment;
    const level = await this.findLevel(sku);
    if (level === null) return Err.make(VariantNotFound.make(sku.value));

    return Err.make(InsufficientStock.make(sku.value, quantity.value, level.onHand));
  }
}
