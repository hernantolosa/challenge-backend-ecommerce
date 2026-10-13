import { type InvariantViolated } from '@shared/errors/invariant-violated.error';
import { Err } from '@shared/result/err';
import { exhaustiveMatchGuard, unreachable } from '@shared/result/match';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result';
import { type RecordStockMovementError } from '@stock/application/errors/record-stock-movement.errors';
import { type RecordStockMovementInputDto } from '@stock/application/dto/record-stock-movement-input.dto';
import { type RecordStockMovementOutputDto } from '@stock/application/dto/record-stock-movement-output.dto';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { IdempotencyKeyReused } from '@stock/domain/errors/idempotency-key-reused.error';
import { IdempotencyKey } from '@stock/domain/idempotency-key';
import { StockAdjustment } from '@stock/domain/stock-adjustment';
import { type StockMovement } from '@stock/domain/stock-movement';

type RecordStockMovementResult = Result<RecordStockMovementOutputDto, RecordStockMovementError>;

export class RecordStockMovement {
  constructor(private readonly ledger: StockLedger) {}

  async execute(input: RecordStockMovementInputDto): Promise<RecordStockMovementResult> {
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

function buildLedgerEntry(
  input: RecordStockMovementInputDto,
): Result<LedgerEntry, InvariantViolated> {
  const adjustment = StockAdjustment.make(input.sku, input.quantity, input.reason);

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
  input: RecordStockMovementInputDto,
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
): Result<RecordStockMovementOutputDto, IdempotencyKeyReused> {
  if (!entry.adjustment.isSameRequestAs(previous)) {
    return Err.make(IdempotencyKeyReused.make(entry.idempotencyKey.value));
  }

  return Ok.make({ movement: previous, replayed: true });
}
