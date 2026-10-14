import { FAKE_CLOCK } from '@test/fixtures/clock.fixtures';
import { type RecordEntryError } from '@stock/application/errors/record-entry.errors';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry.interface';
import { type RecordedMovement } from '@stock/application/ports/recorded-movement.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { MAX_STOCK_LEVEL } from '@stock/domain/constants/stock.constants';
import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type StockLevel } from '@stock/domain/entities/stock-level.entity';
import { type StockMovement } from '@stock/domain/entities/stock-movement.entity';
import { type Sku } from '@stock/domain/value-objects/sku.value-object';
import { Err } from '@shared/result/err';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result.type';

export class InMemoryStockLedger implements StockLedger, StockLevelReader {
  private readonly levels = new Map<string, number>();
  private readonly recorded: StockMovement[] = [];

  withStock(sku: string, onHand: number): this {
    this.levels.set(sku, onHand);
    return this;
  }

  withRecordedMovement(movement: StockMovement): this {
    this.recorded.push(movement);
    return this;
  }

  stockOf(sku: string): number | undefined {
    return this.levels.get(sku);
  }

  get movements(): readonly StockMovement[] {
    return this.recorded;
  }

  async record(entry: LedgerEntry): Promise<Result<RecordedMovement, RecordEntryError>> {
    const previous = this.recorded.find((movement) => isRecordedUnder(movement, entry));
    if (previous !== undefined) {
      return Ok.make({ movement: previous, alreadyRecorded: true });
    }

    const onHand = this.levels.get(entry.adjustment.sku.value);
    if (onHand === undefined) {
      return Err.make(VariantNotFound.make(entry.adjustment.sku.value));
    }
    if (!fitsWithin(onHand + entry.adjustment.stockDelta)) {
      return entry.adjustment.rejectionAgainst(onHand);
    }

    const movement = this.append(entry, onHand + entry.adjustment.stockDelta);
    return Ok.make({ movement, alreadyRecorded: false });
  }

  async findLevel(sku: Sku): Promise<StockLevel | null> {
    const onHand = this.levels.get(sku.value);
    return onHand === undefined ? null : { sku: sku.value, onHand };
  }

  private append(entry: LedgerEntry, balanceAfter: number): StockMovement {
    const movement: StockMovement = {
      id: `movement-${this.recorded.length + 1}`,
      sku: entry.adjustment.sku.value,
      quantity: entry.adjustment.quantity.value,
      reason: entry.adjustment.reason,
      balanceAfter,
      createdBy: entry.createdBy,
      idempotencyKey: entry.idempotencyKey.value,
      occurredAt: FAKE_CLOCK,
    };

    this.levels.set(movement.sku, balanceAfter);
    this.recorded.push(movement);
    return movement;
  }
}

function isRecordedUnder(movement: StockMovement, entry: LedgerEntry): boolean {
  return (
    movement.createdBy === entry.createdBy && movement.idempotencyKey === entry.idempotencyKey.value
  );
}

function fitsWithin(balanceAfter: number): boolean {
  return balanceAfter >= 0 && balanceAfter <= MAX_STOCK_LEVEL;
}
