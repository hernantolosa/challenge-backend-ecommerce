import { IdempotencyKey } from '../../domain/idempotency-key';
import { StockAdjustment } from '../../domain/stock-adjustment';
import { type StockMovement } from '../../domain/stock-movement';
import {
  IdempotencyKeyReused,
  type InsufficientStock,
  type VariantNotFound,
} from '../../domain/stock.errors';
import { type InvariantViolated } from '../../../utils/invariant-violated';
import { Err, Ok, type Result } from '../../../utils/result';
import { type RecordStockMovementCommand } from '../dto/record-stock-movement.command';
import { toStockMovementView, type StockMovementView } from '../dto/stock-movement.view';
import { type LedgerEntry, type StockLedger } from '../ports/stock-ledger.port';

export interface RecordedStockMovement {
  readonly movement: StockMovementView;
  readonly replayed: boolean;
}

export type RecordStockMovementError =
  | InvariantViolated
  | VariantNotFound
  | InsufficientStock
  | IdempotencyKeyReused;

type RecordStockMovementResult = Result<RecordedStockMovement, RecordStockMovementError>;

export class RecordStockMovement {
  constructor(private readonly ledger: StockLedger) {}

  async execute(command: RecordStockMovementCommand): Promise<RecordStockMovementResult> {
    const entry = toLedgerEntry(command);
    if (!entry.ok) return entry;

    const previous = await this.ledger.findMovement(entry.value.actor, entry.value.idempotencyKey);
    if (previous !== null) return replay(previous, entry.value);

    return this.recordNew(entry.value);
  }

  private async recordNew(entry: LedgerEntry): Promise<RecordStockMovementResult> {
    const recorded = await this.ledger.record(entry);
    if (recorded.ok) {
      return Ok.make({ movement: toStockMovementView(recorded.value), replayed: false });
    }

    if (recorded.error.kind === 'IdempotencyKeyTaken') return this.replayConcurrentWinner(entry);

    return Err.make(recorded.error);
  }

  private async replayConcurrentWinner(entry: LedgerEntry): Promise<RecordStockMovementResult> {
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

function replay(previous: StockMovement, entry: LedgerEntry): RecordStockMovementResult {
  if (!entry.adjustment.isSameRequestAs(previous)) {
    return Err.make(IdempotencyKeyReused.make(entry.idempotencyKey.value));
  }

  return Ok.make({ movement: toStockMovementView(previous), replayed: true });
}
