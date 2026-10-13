import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '@infrastructure/database/errors/postgres-errors';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';
import { IdempotencyKeyTaken } from '@stock/application/errors/idempotency-key-taken.error';
import { type RecordEntryError } from '@stock/application/errors/record-entry.error';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { InsufficientStock } from '@stock/domain/errors/insufficient-stock.error';
import { StockCapacityExceeded } from '@stock/domain/errors/stock-capacity-exceeded.error';
import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock-capacity';
import { type StockLevel } from '@stock/domain/interfaces/stock-level.interface';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key';
import { type Sku } from '@stock/domain/value-objects/sku';
import { type AppliedAdjustmentRow } from '@stock/adapters/outbound/persistence/rows/applied-adjustment.row';
import {
  APPLY_ADJUSTMENT_AND_APPEND_MOVEMENT_SQL,
  FIND_LEVEL_SQL,
  FIND_MOVEMENT_SQL,
} from '@stock/adapters/outbound/persistence/queries/stock-ledger.queries';
import { toStockMovementFromAppliedRow } from '@stock/adapters/outbound/persistence/mappers/stock-movement.mapper';
import { IDEMPOTENCY_CONSTRAINT } from '@stock/adapters/outbound/persistence/entities/stock-movement.orm-entity';

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
      MAX_STOCK_LEVEL,
    ]);
  }

  private async rejectionReasonFor(
    entry: LedgerEntry,
  ): Promise<Err<VariantNotFound> | Err<InsufficientStock> | Err<StockCapacityExceeded>> {
    const { sku, quantity, stockDelta } = entry.adjustment;
    const level = await this.findLevel(sku);
    if (level === null) return Err.make(VariantNotFound.make(sku.value));

    if (level.onHand + stockDelta < 0) {
      return Err.make(InsufficientStock.make(sku.value, quantity.value, level.onHand));
    }
    return Err.make(
      StockCapacityExceeded.make(sku.value, quantity.value, level.onHand, MAX_STOCK_LEVEL),
    );
  }
}
