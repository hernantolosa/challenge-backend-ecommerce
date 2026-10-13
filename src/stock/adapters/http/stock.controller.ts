import { Body, Controller, Get, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { type Response } from 'express';
import { CurrentPrincipal, RequireScope } from '@shared/auth/auth.decorators';
import { type Principal } from '@shared/auth/principal.interface';
import { ProblemException } from '@shared/http/problem.exception';
import { exhaustiveMatchGuard } from '@shared/result/match';
import { GetStockLevel } from '@stock/application/use-cases/get-stock-level.use-case';
import { RecordStockMovement } from '@stock/application/use-cases/record-stock-movement.use-case';
import { IdempotencyKeyHeader } from './idempotency-key.decorator';
import { IdempotencyKeyHeaderDto } from '@stock/adapters/http/dto/idempotency-key-header.dto';
import { RecordStockMovementRequestDto } from '@stock/adapters/http/dto/record-stock-movement-request.dto';
import { type StockLevelResponseDto } from '@stock/adapters/http/dto/stock-level-response.dto';
import { StockLevelParamsDto } from '@stock/adapters/http/dto/stock-level-params.dto';
import { type StockMovementResponseDto } from '@stock/adapters/http/dto/stock-movement-response.dto';
import { toStockLevelResponseDto, toStockMovementResponseDto } from './stock-response.mapper';
import { StockProblems } from './stock.problems';
import { StockScope } from './stock.scopes';

@Controller('stock')
export class StockController {
  constructor(
    private readonly recordStockMovement: RecordStockMovement,
    private readonly getStockLevel: GetStockLevel,
  ) {}

  @Post('movimientos')
  @RequireScope(StockScope.WRITE)
  async recordMovement(
    @Body() body: RecordStockMovementRequestDto,
    @IdempotencyKeyHeader() header: IdempotencyKeyHeaderDto,
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StockMovementResponseDto> {
    const outcome = await this.recordStockMovement.execute({
      ...body,
      idempotencyKey: header.idempotencyKey,
      actor: principal.subject,
    });

    switch (outcome.kind) {
      case 'Ok':
        if (outcome.value.replayed)
          response.status(HttpStatus.OK).setHeader('Idempotent-Replayed', 'true');
        return toStockMovementResponseDto(outcome.value.movement);
      case 'InvariantViolated':
        throw ProblemException.invariantViolated(outcome.error);
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
  @RequireScope(StockScope.READ)
  async findStockLevel(@Param() params: StockLevelParamsDto): Promise<StockLevelResponseDto> {
    const outcome = await this.getStockLevel.execute({ sku: params.sku });

    switch (outcome.kind) {
      case 'Ok':
        return toStockLevelResponseDto(outcome.value);
      case 'InvariantViolated':
        throw ProblemException.invariantViolated(outcome.error);
      case 'VariantNotFound':
        throw StockProblems.variantNotFound(outcome.error);
      default:
        return exhaustiveMatchGuard(outcome);
    }
  }
}
