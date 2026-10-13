import { FAKE_CLOCK } from '@test/fixtures/clock.fixtures';
import { IdempotencyKeyTaken } from '@stock/application/errors/idempotency-key-taken.error';
import { type RecordEntryError } from '@stock/application/errors/record-entry.error';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { type StockLevelReader } from '@stock/application/ports/stock-level-reader.port';
import { VariantNotFound } from '@stock/domain/errors/variant-not-found.error';
import { type StockLevel } from '@stock/domain/interfaces/stock-level.interface';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { type IdempotencyKey } from '@stock/domain/value-objects/idempotency-key';
import { type Sku } from '@stock/domain/value-objects/sku';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';

export class InMemoryStockLedger implements StockLedger, StockLevelReader {
  private readonly levels = new Map<string, number>();
  private readonly recorded: StockMovement[] = [];
  private concurrentWinner: StockMovement | null = null;

  withStock(sku: string, onHand: number): this {
    this.levels.set(sku, onHand);
    return this;
  }

  simulateConcurrentWinner(movement: StockMovement): void {
    this.concurrentWinner = movement;
  }

  stockOf(sku: string): number | undefined {
    return this.levels.get(sku);
  }

  get movements(): readonly StockMovement[] {
    return this.recorded;
  }

  async record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    if (this.concurrentWinner !== null) return this.recordWinnerAndLoseRace(this.concurrentWinner);

    const onHand = this.levels.get(entry.adjustment.sku.value);
    if (onHand === undefined || !entry.adjustment.fitsWithin(onHand)) {
      return this.rejectionReasonFor(entry, onHand);
    }
    if (this.isKeyTakenBy(entry.actor, entry.idempotencyKey)) {
      return Err.make(IdempotencyKeyTaken.make());
    }

    return Ok.make(this.append(entry, onHand + entry.adjustment.stockDelta));
  }

  async findMovement(actor: string, idempotencyKey: IdempotencyKey): Promise<StockMovement | null> {
    return (
      this.recorded.find((movement) => belongsToActorAndKey(movement, actor, idempotencyKey)) ??
      null
    );
  }

  async findLevel(sku: Sku): Promise<StockLevel | null> {
    const onHand = this.levels.get(sku.value);
    return onHand === undefined ? null : { sku: sku.value, onHand };
  }

  private rejectionReasonFor(
    entry: LedgerEntry,
    onHand: number | undefined,
  ): Result<StockMovement, RecordEntryError> {
    if (this.isKeyTakenBy(entry.actor, entry.idempotencyKey)) {
      return Err.make(IdempotencyKeyTaken.make());
    }
    if (onHand === undefined) return Err.make(VariantNotFound.make(entry.adjustment.sku.value));

    return entry.adjustment.rejectionAgainst(onHand);
  }

  private recordWinnerAndLoseRace(winner: StockMovement): Err<IdempotencyKeyTaken> {
    this.recorded.push(winner);
    this.concurrentWinner = null;
    return Err.make(IdempotencyKeyTaken.make());
  }

  private isKeyTakenBy(actor: string, idempotencyKey: IdempotencyKey): boolean {
    return this.recorded.some((movement) => belongsToActorAndKey(movement, actor, idempotencyKey));
  }

  private append(entry: LedgerEntry, balanceAfter: number): StockMovement {
    const movement: StockMovement = {
      id: `movement-${this.recorded.length + 1}`,
      sku: entry.adjustment.sku.value,
      quantity: entry.adjustment.quantity.value,
      reason: entry.adjustment.reason,
      balanceAfter,
      actor: entry.actor,
      idempotencyKey: entry.idempotencyKey.value,
      occurredAt: FAKE_CLOCK,
    };

    this.levels.set(movement.sku, balanceAfter);
    this.recorded.push(movement);
    return movement;
  }
}

function belongsToActorAndKey(
  movement: StockMovement,
  actor: string,
  idempotencyKey: IdempotencyKey,
): boolean {
  return movement.actor === actor && movement.idempotencyKey === idempotencyKey.value;
}
