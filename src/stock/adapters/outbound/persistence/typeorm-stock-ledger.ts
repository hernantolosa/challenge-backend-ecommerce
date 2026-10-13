import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { isUniqueViolation } from '../../../../database/postgres-errors';
import { Err } from '../../../../utils/result/err';
import { Ok } from '../../../../utils/result/ok';
import { type Result } from '../../../../utils/result/result';
import { IdempotencyKeyTaken } from '../../../application/errors/idempotency-key-taken.error';
import { type RecordEntryError } from '../../../application/errors/record-entry.error';
import { type LedgerEntry } from '../../../application/ports/ledger-entry.interface';
import { type StockLedger } from '../../../application/ports/stock-ledger.port';
import { type StockLevelReader } from '../../../application/ports/stock-level-reader.port';
import { InsufficientStock } from '../../../domain/errors/insufficient-stock.error';
import { VariantNotFound } from '../../../domain/errors/variant-not-found.error';
import { type StockLevel } from '../../../domain/interfaces/stock-level.interface';
import { type StockMovement } from '../../../domain/interfaces/stock-movement.interface';
import { type IdempotencyKey } from '../../../domain/value-objects/idempotency-key';
import { type Sku } from '../../../domain/value-objects/sku';
import { type AppliedAdjustmentRow } from './applied-adjustment.row';
import { APPLY_ADJUSTMENT_SQL, FIND_LEVEL_SQL, FIND_MOVEMENT_SQL } from './stock-ledger.sql';
import { toStockMovement } from './stock-movement.mapper';
import { IDEMPOTENCY_CONSTRAINT } from './stock-movement.orm-entity';

@Injectable()
export class TypeOrmStockLedger implements StockLedger, StockLevelReader {
  constructor(private readonly dataSource: DataSource) {}

  async record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    try {
      const [applied] = await this.applyAdjustment(entry);
      if (applied === undefined) return this.explainRejection(entry);

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

  private async explainRejection(
    entry: LedgerEntry,
  ): Promise<Err<VariantNotFound> | Err<InsufficientStock>> {
    const { sku, quantity } = entry.adjustment;
    const level = await this.findLevel(sku);
    if (level === null) return Err.make(VariantNotFound.make(sku.value));

    return Err.make(InsufficientStock.make(sku.value, quantity.value, level.onHand));
  }
}
