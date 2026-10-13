import { type InvariantViolated } from '@shared/invariant-violated';
import { Err, exhaustiveMatchGuard, Ok, unreachable, type Result } from '@shared/result';
import { IdempotencyKey } from '@stock/domain/idempotency-key';
import { type MovementReason } from '@stock/domain/movement-reason';
import { StockAdjustment } from '@stock/domain/stock-adjustment';
import {
  IdempotencyKeyReused,
  type InsufficientStock,
  type StockCapacityExceeded,
  type VariantNotFound,
} from '@stock/domain/stock.errors';
import { type StockMovement } from '@stock/domain/stock-movement';
import { type LedgerEntry, type StockLedger } from './stock-ledger.port';

export interface RecordStockMovementInput {
  readonly sku: string;
  readonly quantity: number;
  readonly reason: MovementReason;
  readonly idempotencyKey: string;
  readonly actor: string;
}

export interface RecordedStockMovement {
  readonly movement: StockMovement;
  readonly replayed: boolean;
}

export type RecordStockMovementError =
  | InvariantViolated
  | VariantNotFound
  | InsufficientStock
  | StockCapacityExceeded
  | IdempotencyKeyReused;

type RecordStockMovementResult = Result<RecordedStockMovement, RecordStockMovementError>;

export class RecordStockMovement {
  constructor(private readonly ledger: StockLedger) {}

  async execute(input: RecordStockMovementInput): Promise<RecordStockMovementResult> {
    const entry = buildLedgerEntry(input);

    switch (entry.kind) {
      case 'Ok':
        return this.replayOrRecordMovement(entry.value);
      case 'InvariantViolated':
        return entry;
      default:
        return exhaustiveMatchGuard(entry);
    }
  }

  private async replayOrRecordMovement(entry: LedgerEntry): Promise<RecordStockMovementResult> {
    const previous = await this.ledger.findMovement(entry.actor, entry.idempotencyKey);
    if (previous !== null) return replayPreviousMovement(previous, entry);

    return this.recordNewMovement(entry);
  }

  private async recordNewMovement(entry: LedgerEntry): Promise<RecordStockMovementResult> {
    const recorded = await this.ledger.record(entry);

    switch (recorded.kind) {
      case 'Ok':
        return Ok.make({ movement: recorded.value, replayed: false });
      case 'IdempotencyKeyTaken':
        return this.replayMovementRecordedConcurrently(entry);
      case 'VariantNotFound':
      case 'InsufficientStock':
      case 'StockCapacityExceeded':
        return recorded;
      default:
        return exhaustiveMatchGuard(recorded);
    }
  }

  private async replayMovementRecordedConcurrently(
    entry: LedgerEntry,
  ): Promise<RecordStockMovementResult> {
    const winner = await this.ledger.findMovement(entry.actor, entry.idempotencyKey);
    if (winner === null) return unreachable('an idempotency key was taken without a movement');

    return replayPreviousMovement(winner, entry);
  }
}

function buildLedgerEntry(input: RecordStockMovementInput): Result<LedgerEntry, InvariantViolated> {
  const adjustment = StockAdjustment.make(input);

  switch (adjustment.kind) {
    case 'Ok':
      return buildLedgerEntryWithKey(adjustment.value, input);
    case 'InvariantViolated':
      return adjustment;
    default:
      return exhaustiveMatchGuard(adjustment);
  }
}

function buildLedgerEntryWithKey(
  adjustment: StockAdjustment,
  input: RecordStockMovementInput,
): Result<LedgerEntry, InvariantViolated> {
  const idempotencyKey = IdempotencyKey.make(input.idempotencyKey);

  switch (idempotencyKey.kind) {
    case 'Ok':
      return Ok.make({ adjustment, actor: input.actor, idempotencyKey: idempotencyKey.value });
    case 'InvariantViolated':
      return idempotencyKey;
    default:
      return exhaustiveMatchGuard(idempotencyKey);
  }
}

function replayPreviousMovement(
  previous: StockMovement,
  entry: LedgerEntry,
): Result<RecordedStockMovement, IdempotencyKeyReused> {
  if (!entry.adjustment.isSameRequestAs(previous)) {
    return Err.make(IdempotencyKeyReused.make(entry.idempotencyKey.value));
  }

  return Ok.make({ movement: previous, replayed: true });
}
