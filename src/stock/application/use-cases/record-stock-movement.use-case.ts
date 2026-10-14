import { type InvariantViolated } from '@shared/errors/invariant-violated.error';
import { Err } from '@shared/result/err';
import { exhaustiveMatchGuard } from '@shared/result/match';
import { Ok } from '@shared/result/ok';
import { type Result } from '@shared/result/result.type';
import { type RecordStockMovementError } from '@stock/application/errors/record-stock-movement.errors';
import { type RecordStockMovementInputDto } from '@stock/application/dto/record-stock-movement-input.dto';
import { type RecordStockMovementOutputDto } from '@stock/application/dto/record-stock-movement-output.dto';
import { type LedgerEntry } from '@stock/application/ports/ledger-entry.interface';
import { type RecordedMovement } from '@stock/application/ports/recorded-movement.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';
import { IdempotencyKeyReused } from '@stock/domain/errors/idempotency-key-reused.error';
import { IdempotencyKey } from '@stock/domain/value-objects/idempotency-key.value-object';
import { StockAdjustment } from '@stock/domain/value-objects/stock-adjustment.value-object';

type RecordStockMovementResult = Result<RecordStockMovementOutputDto, RecordStockMovementError>;

export class RecordStockMovement {
  constructor(private readonly ledger: StockLedger) {}

  async execute(input: RecordStockMovementInputDto): Promise<RecordStockMovementResult> {
    const entry = buildLedgerEntry(input);

    switch (entry.kind) {
      case 'Ok':
        return this.recordMovement(entry.value);
      case 'InvariantViolated':
        return entry;
      default:
        return exhaustiveMatchGuard(entry);
    }
  }

  private async recordMovement(entry: LedgerEntry): Promise<RecordStockMovementResult> {
    const recorded = await this.ledger.record(entry);

    switch (recorded.kind) {
      case 'Ok':
        return replayOrAccept(recorded.value, entry);
      case 'VariantNotFound':
      case 'InsufficientStock':
      case 'StockCapacityExceeded':
        return recorded;
      default:
        return exhaustiveMatchGuard(recorded);
    }
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
      return Ok.make({
        adjustment,
        createdBy: input.createdBy,
        idempotencyKey: idempotencyKey.value,
      });
    case 'InvariantViolated':
      return idempotencyKey;
    default:
      return exhaustiveMatchGuard(idempotencyKey);
  }
}

function replayOrAccept(
  recorded: RecordedMovement,
  entry: LedgerEntry,
): Result<RecordStockMovementOutputDto, IdempotencyKeyReused> {
  const { movement, alreadyRecorded } = recorded;
  if (!alreadyRecorded) return Ok.make({ movement, replayed: false });
  if (!entry.adjustment.isSameRequestAs(movement)) {
    return Err.make(IdempotencyKeyReused.make(entry.idempotencyKey.value));
  }

  return Ok.make({ movement, replayed: true });
}
