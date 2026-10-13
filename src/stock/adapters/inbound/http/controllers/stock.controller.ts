import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { CurrentPrincipal } from '../../../../../infrastructure/auth/current-principal.decorator';
import { type Principal } from '../../../../../infrastructure/auth/interfaces/principal.interface';
import { RequireScope } from '../../../../../infrastructure/auth/require-scope.decorator';
import { Scope } from '../../../../../infrastructure/auth/scope';
import { exhaustiveMatchGuard } from '../../../../../utils/exhaustive-match-guard';
import { HttpOutcome } from '../../../../../infrastructure/http/http-outcome';
import { GetStockLevel } from '../../../../application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from '../../../../application/use-cases/record-stock-movement.use-case';
import { RecordStockMovementRequest } from '../requests/record-stock-movement.request';
import { StockLevelResponse } from '../responses/stock-level.response';
import { StockMovementResponse } from '../responses/stock-movement.response';
import { IdempotencyKeyHeader } from '../decorators/idempotency-key.decorator';

const IDEMPOTENT_REPLAYED_HEADER = 'Idempotent-Replayed';

@Controller('stock')
export class StockController {
  constructor(
    private readonly recordStockMovement: RecordStockMovement,
    private readonly getStockLevel: GetStockLevel,
  ) {}

  @Post('movimientos')
  @RequireScope(Scope.STOCK_WRITE)
  async record(
    @Body() body: RecordStockMovementRequest,
    @IdempotencyKeyHeader() idempotencyKey: string,
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StockMovementResponse> {
    const outcome = await this.recordStockMovement.execute({
      ...body,
      idempotencyKey,
      actor: principal.subject,
    });

    switch (outcome.kind) {
      case 'Ok':
        if (outcome.value.replayed) markAsReplayed(response);
        return StockMovementResponse.from(outcome.value.movement);
      case 'InvariantViolated':
        throw HttpOutcome.badRequest(outcome.error, outcome.error.message, {
          field: outcome.error.field,
        });
      case 'VariantNotFound':
        throw HttpOutcome.notFound(outcome.error, `Variant ${outcome.error.sku} not found`);
      case 'InsufficientStock':
        throw HttpOutcome.conflict(outcome.error, `Not enough stock for ${outcome.error.sku}`, {
          requested: outcome.error.requested,
          available: outcome.error.available,
        });
      case 'IdempotencyKeyReused':
        throw HttpOutcome.unprocessable(
          outcome.error,
          'Idempotency-Key was already used for a different request',
        );
      default:
        return exhaustiveMatchGuard(outcome);
    }
  }

  @Get(':sku')
  @RequireScope(Scope.STOCK_READ)
  async level(@Param('sku') sku: string): Promise<StockLevelResponse> {
    const outcome = await this.getStockLevel.execute(sku);

    switch (outcome.kind) {
      case 'Ok':
        return StockLevelResponse.from(outcome.value);
      case 'InvariantViolated':
        throw HttpOutcome.badRequest(outcome.error, outcome.error.message, {
          field: outcome.error.field,
        });
      case 'VariantNotFound':
        throw HttpOutcome.notFound(outcome.error, `Variant ${outcome.error.sku} not found`);
      default:
        return exhaustiveMatchGuard(outcome);
    }
  }
}

function markAsReplayed(response: Response): void {
  response.status(HttpStatus.OK).setHeader(IDEMPOTENT_REPLAYED_HEADER, 'true');
}
