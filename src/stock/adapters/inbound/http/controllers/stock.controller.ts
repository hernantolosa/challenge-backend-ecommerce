import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { CurrentPrincipal } from '@infrastructure/auth/decorators/current-principal.decorator';
import { type Principal } from '@infrastructure/auth/interfaces/principal.interface';
import { RequireScope } from '@infrastructure/auth/decorators/require-scope.decorator';
import { Scope } from '@infrastructure/auth/enums/scope';
import { exhaustiveMatchGuard } from '@utils/exhaustive-match-guard';
import { CommonProblems } from '@infrastructure/http/problems/common.problems';
import { GetStockLevel } from '@stock/application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from '@stock/application/use-cases/record-stock-movement.use-case';
import { RecordStockMovementRequestDto } from '@stock/adapters/inbound/http/requests/record-stock-movement-request.dto';
import { StockLevelResponseDto } from '@stock/adapters/inbound/http/responses/stock-level-response.dto';
import { StockMovementResponseDto } from '@stock/adapters/inbound/http/responses/stock-movement-response.dto';
import { IdempotencyKeyHeader } from '@stock/adapters/inbound/http/decorators/idempotency-key.decorator';
import { StockProblems } from '@stock/adapters/inbound/http/problems/stock.problems';

const IDEMPOTENT_REPLAYED_HEADER = 'Idempotent-Replayed';

@Controller('stock')
export class StockController {
  constructor(
    private readonly recordStockMovement: RecordStockMovement,
    private readonly getStockLevel: GetStockLevel,
  ) {}

  @Post('movimientos')
  @RequireScope(Scope.STOCK_WRITE)
  async recordMovement(
    @Body() body: RecordStockMovementRequestDto,
    @IdempotencyKeyHeader() idempotencyKey: string,
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StockMovementResponseDto> {
    const outcome = await this.recordStockMovement.execute({
      ...body,
      idempotencyKey,
      actor: principal.subject,
    });

    switch (outcome.kind) {
      case 'Ok':
        if (outcome.value.replayed) markResponseAsReplayed(response);
        return StockMovementResponseDto.from(outcome.value.movement);
      case 'InvariantViolated':
        throw CommonProblems.invariantViolated(outcome.error);
      case 'VariantNotFound':
        throw StockProblems.variantNotFound(outcome.error);
      case 'InsufficientStock':
        throw StockProblems.insufficientStock(outcome.error);
      case 'StockCapacityExceeded':
        throw StockProblems.stockCapacityExceeded(outcome.error);
      case 'IdempotencyKeyReused':
        throw StockProblems.idempotencyKeyReused(outcome.error);
      default:
        return exhaustiveMatchGuard(outcome);
    }
  }

  @Get(':sku')
  @RequireScope(Scope.STOCK_READ)
  async findStockLevel(@Param('sku') sku: string): Promise<StockLevelResponseDto> {
    const outcome = await this.getStockLevel.execute(sku);

    switch (outcome.kind) {
      case 'Ok':
        return StockLevelResponseDto.from(outcome.value);
      case 'InvariantViolated':
        throw CommonProblems.invariantViolated(outcome.error);
      case 'VariantNotFound':
        throw StockProblems.variantNotFound(outcome.error);
      default:
        return exhaustiveMatchGuard(outcome);
    }
  }
}

function markResponseAsReplayed(response: Response): void {
  response.status(HttpStatus.OK).setHeader(IDEMPOTENT_REPLAYED_HEADER, 'true');
}
