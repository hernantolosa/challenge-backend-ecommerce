import { IdempotencyKeyReused } from '../../domain/errors/idempotency-key-reused.error';
import { type StockMovement } from '../../domain/interfaces/stock-movement.interface';
import { StockAdjustment } from '../../domain/stock-adjustment';
import { IdempotencyKey } from '../../domain/value-objects/idempotency-key';
import { type InvariantViolated } from '../../../utils/errors/invariant-violated.error';
import { exhaustiveMatchGuard } from '../../../utils/exhaustive-match-guard';
import { Err } from '../../../utils/result/err';
import { Ok } from '../../../utils/result/ok';
import { type Result } from '../../../utils/result/result';
import { type RecordStockMovementCommand } from '../dto/record-stock-movement.command';
import { type RecordedStockMovementView } from '../dto/recorded-stock-movement.view';
import { type RecordStockMovementError } from '../errors/record-stock-movement.error';
import { toStockMovementView } from '../mappers/stock-movement-view.mapper';
import { type LedgerEntry } from '../ports/ledger-entry.interface';
import { type StockLedger } from '../ports/stock-ledger.port';

export class RecordStockMovement {
  constructor(private readonly ledger: StockLedger) {}

  async execute(
    command: RecordStockMovementCommand,
  ): Promise<Result<RecordedStockMovementView, RecordStockMovementError>> {
    const entry = toLedgerEntry(command);

    switch (entry.kind) {
      case 'Ok':
        return this.recordOnce(entry.value);
      case 'InvariantViolated':
        return entry;
      default:
        return exhaustiveMatchGuard(entry);
    }
  }

  private async recordOnce(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementView, RecordStockMovementError>> {
    const previous = await this.ledger.findMovement(entry.actor, entry.idempotencyKey);
    if (previous !== null) return replay(previous, entry);

    return this.recordNew(entry);
  }

  private async recordNew(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementView, RecordStockMovementError>> {
    const recorded = await this.ledger.record(entry);

    switch (recorded.kind) {
      case 'Ok':
        return Ok.make({ movement: toStockMovementView(recorded.value), replayed: false });
      case 'IdempotencyKeyTaken':
        return this.replayConcurrentWinner(entry);
      case 'VariantNotFound':
      case 'InsufficientStock':
        return recorded;
      default:
        return exhaustiveMatchGuard(recorded);
    }
  }

  private async replayConcurrentWinner(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementView, RecordStockMovementError>> {
    const winner = await this.ledger.findMovement(entry.actor, entry.idempotencyKey);
    if (winner === null) throw new Error('Idempotency key was taken but its movement is missing');

    return replay(winner, entry);
  }
}

function toLedgerEntry(
  command: RecordStockMovementCommand,
): Result<LedgerEntry, InvariantViolated> {
  const adjustment = StockAdjustment.make(command);

  switch (adjustment.kind) {
    case 'Ok':
      return withIdempotencyKey(adjustment.value, command);
    case 'InvariantViolated':
      return adjustment;
    default:
      return exhaustiveMatchGuard(adjustment);
  }
}

function withIdempotencyKey(
  adjustment: StockAdjustment,
  command: RecordStockMovementCommand,
): Result<LedgerEntry, InvariantViolated> {
  const idempotencyKey = IdempotencyKey.make(command.idempotencyKey);

  switch (idempotencyKey.kind) {
    case 'Ok':
      return Ok.make({ adjustment, actor: command.actor, idempotencyKey: idempotencyKey.value });
    case 'InvariantViolated':
      return idempotencyKey;
    default:
      return exhaustiveMatchGuard(idempotencyKey);
  }
}

function replay(
  previous: StockMovement,
  entry: LedgerEntry,
): Result<RecordedStockMovementView, IdempotencyKeyReused> {
  if (!entry.adjustment.isSameRequestAs(previous)) {
    return Err.make(IdempotencyKeyReused.make(entry.idempotencyKey.value));
  }

  return Ok.make({ movement: toStockMovementView(previous), replayed: true });
}
