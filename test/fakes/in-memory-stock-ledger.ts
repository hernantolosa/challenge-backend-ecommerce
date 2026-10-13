import {
  IdempotencyKeyTaken,
  StockLedger,
  type LedgerEntry,
  type RecordEntryError,
} from '../../src/stock/application/ports/stock-ledger.port';
import { type IdempotencyKey } from '../../src/stock/domain/idempotency-key';
import { type Sku } from '../../src/stock/domain/sku';
import { type StockLevel } from '../../src/stock/domain/stock-level';
import { type StockMovement } from '../../src/stock/domain/stock-movement';
import { InsufficientStock, VariantNotFound } from '../../src/stock/domain/stock.errors';
import { Err, Ok, type Result } from '../../src/utils/result';

export const FAKE_CLOCK = new Date('2026-10-13T12:00:00.000Z');

export class InMemoryStockLedger extends StockLedger {
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

  levelOf(sku: string): number | undefined {
    return this.levels.get(sku);
  }

  get movements(): readonly StockMovement[] {
    return this.recorded;
  }

  async record(entry: LedgerEntry): Promise<Result<StockMovement, RecordEntryError>> {
    if (this.concurrentWinner !== null) return this.loseRaceTo(this.concurrentWinner);
    if (this.isTaken(entry.actor, entry.idempotencyKey)) {
      return Err.make(IdempotencyKeyTaken.make());
    }

    const sku = entry.adjustment.sku.value;
    const onHand = this.levels.get(sku);
    if (onHand === undefined) return Err.make(VariantNotFound.make(sku));

    const balanceAfter = onHand + entry.adjustment.delta;
    if (balanceAfter < 0) {
      return Err.make(InsufficientStock.make(sku, entry.adjustment.quantity.value, onHand));
    }

    return Ok.make(this.append(entry, balanceAfter));
  }

  async findMovement(actor: string, idempotencyKey: IdempotencyKey): Promise<StockMovement | null> {
    return this.recorded.find((movement) => matches(movement, actor, idempotencyKey)) ?? null;
  }

  async findLevel(sku: Sku): Promise<StockLevel | null> {
    const onHand = this.levels.get(sku.value);
    return onHand === undefined ? null : { sku: sku.value, onHand };
  }

  private loseRaceTo(winner: StockMovement): Err<IdempotencyKeyTaken> {
    this.recorded.push(winner);
    this.concurrentWinner = null;
    return Err.make(IdempotencyKeyTaken.make());
  }

  private isTaken(actor: string, idempotencyKey: IdempotencyKey): boolean {
    return this.recorded.some((movement) => matches(movement, actor, idempotencyKey));
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

function matches(movement: StockMovement, actor: string, idempotencyKey: IdempotencyKey): boolean {
  return movement.actor === actor && movement.idempotencyKey === idempotencyKey.value;
}
