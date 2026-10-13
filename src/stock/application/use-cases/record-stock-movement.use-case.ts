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
    if (!entry.ok) return entry;

    const previous = await this.ledger.findMovement(entry.value.actor, entry.value.idempotencyKey);
    if (previous !== null) return replay(previous, entry.value);

    return this.recordNew(entry.value);
  }

  private async recordNew(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementView, RecordStockMovementError>> {
    const recorded = await this.ledger.record(entry);
    if (recorded.ok) {
      return Ok.make({ movement: toStockMovementView(recorded.value), replayed: false });
    }

    switch (recorded.error.kind) {
      case 'IdempotencyKeyTaken':
        return this.replayConcurrentWinner(entry);
      case 'VariantNotFound':
      case 'InsufficientStock':
        return Err.make(recorded.error);
      default:
        return exhaustiveMatchGuard(recorded.error);
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
  if (!adjustment.ok) return adjustment;

  const idempotencyKey = IdempotencyKey.make(command.idempotencyKey);
  if (!idempotencyKey.ok) return idempotencyKey;

  return Ok.make({
    adjustment: adjustment.value,
    actor: command.actor,
    idempotencyKey: idempotencyKey.value,
  });
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
