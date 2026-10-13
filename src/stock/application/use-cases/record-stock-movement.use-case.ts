import { IdempotencyKeyReused } from '@stock/domain/errors/idempotency-key-reused.error';
import { type StockMovement } from '@stock/domain/interfaces/stock-movement.interface';
import { StockAdjustment } from '@stock/domain/value-objects/stock-adjustment';
import { IdempotencyKey } from '@stock/domain/value-objects/idempotency-key';
import { type InvariantViolated } from '@utils/errors/invariant-violated.error';
import { exhaustiveMatchGuard } from '@utils/exhaustive-match-guard';
import { Err } from '@utils/result/err';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';
import { type RecordStockMovementInputDto } from '@stock/application/dto/record-stock-movement-input.dto';
import { type RecordedStockMovementDto } from '@stock/application/dto/recorded-stock-movement.dto';
import { type RecordStockMovementError } from '@stock/application/errors/record-stock-movement.error';
import { toStockMovementDto } from '@stock/application/mappers/stock-movement-dto.mapper';
import { type LedgerEntry } from '@stock/application/interfaces/ledger-entry.interface';
import { type StockLedger } from '@stock/application/ports/stock-ledger.port';

export class RecordStockMovement {
  constructor(private readonly ledger: StockLedger) {}

  async execute(
    command: RecordStockMovementInputDto,
  ): Promise<Result<RecordedStockMovementDto, RecordStockMovementError>> {
    const entry = buildLedgerEntry(command);

    switch (entry.kind) {
      case 'Ok':
        return this.replayOrRecordMovement(entry.value);
      case 'InvariantViolated':
        return entry;
      default:
        return exhaustiveMatchGuard(entry);
    }
  }

  private async replayOrRecordMovement(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementDto, RecordStockMovementError>> {
    const previous = await this.ledger.findMovement(entry.actor, entry.idempotencyKey);
    if (previous !== null) return replayPreviousMovement(previous, entry);

    return this.recordNewMovement(entry);
  }

  private async recordNewMovement(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementDto, RecordStockMovementError>> {
    const recorded = await this.ledger.record(entry);

    switch (recorded.kind) {
      case 'Ok':
        return Ok.make({ movement: toStockMovementDto(recorded.value), replayed: false });
      case 'IdempotencyKeyTaken':
        return this.replayMovementRecordedConcurrently(entry);
      case 'VariantNotFound':
      case 'InsufficientStock':
        return recorded;
      default:
        return exhaustiveMatchGuard(recorded);
    }
  }

  private async replayMovementRecordedConcurrently(
    entry: LedgerEntry,
  ): Promise<Result<RecordedStockMovementDto, RecordStockMovementError>> {
    const winner = await this.ledger.findMovement(entry.actor, entry.idempotencyKey);
    if (winner === null) throw new Error('Idempotency key was taken but its movement is missing');

    return replayPreviousMovement(winner, entry);
  }
}

function buildLedgerEntry(
  command: RecordStockMovementInputDto,
): Result<LedgerEntry, InvariantViolated> {
  const adjustment = StockAdjustment.make(command);

  switch (adjustment.kind) {
    case 'Ok':
      return buildLedgerEntryWithKey(adjustment.value, command);
    case 'InvariantViolated':
      return adjustment;
    default:
      return exhaustiveMatchGuard(adjustment);
  }
}

function buildLedgerEntryWithKey(
  adjustment: StockAdjustment,
  command: RecordStockMovementInputDto,
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

function replayPreviousMovement(
  previous: StockMovement,
  entry: LedgerEntry,
): Result<RecordedStockMovementDto, IdempotencyKeyReused> {
  if (!entry.adjustment.isSameRequestAs(previous)) {
    return Err.make(IdempotencyKeyReused.make(entry.idempotencyKey.value));
  }

  return Ok.make({ movement: toStockMovementDto(previous), replayed: true });
}
