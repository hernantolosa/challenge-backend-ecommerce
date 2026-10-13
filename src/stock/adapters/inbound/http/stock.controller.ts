import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UnprocessableEntityException,
  type HttpException,
} from '@nestjs/common';
import { type Response } from 'express';
import { CurrentPrincipal } from '../../../../auth/current-principal.decorator';
import { type Principal } from '../../../../auth/principal';
import { RequireScope } from '../../../../auth/require-scope.decorator';
import { Scope } from '../../../../auth/scope';
import { assertNever } from '../../../../utils/assert-never';
import {
  GetStockLevel,
  type GetStockLevelError,
} from '../../../application/use-cases/get-stock-level.use-case';
import {
  RecordStockMovement,
  type RecordStockMovementError,
} from '../../../application/use-cases/record-stock-movement.use-case';
import { RecordStockMovementRequest } from './dto/record-stock-movement.request';
import { StockLevelResponse } from './dto/stock-level.response';
import { StockMovementResponse } from './dto/stock-movement.response';
import { IdempotencyKeyHeader } from './idempotency-key.decorator';

const IDEMPOTENT_REPLAYED_HEADER = 'Idempotent-Replayed';

type StockError = RecordStockMovementError | GetStockLevelError;

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
    const result = await this.recordStockMovement.execute({
      ...body,
      idempotencyKey,
      actor: principal.subject,
    });
    if (!result.ok) throw this.toHttpException(result.error);

    if (result.value.replayed) markAsReplayed(response);
    return StockMovementResponse.from(result.value.movement);
  }

  @Get(':sku')
  @RequireScope(Scope.STOCK_READ)
  async level(@Param('sku') sku: string): Promise<StockLevelResponse> {
    const result = await this.getStockLevel.execute(sku);
    if (!result.ok) throw this.toHttpException(result.error);

    return StockLevelResponse.from(result.value);
  }

  private toHttpException(error: StockError): HttpException {
    switch (error.kind) {
      case 'InvariantViolated':
        return new BadRequestException({
          error: error.kind,
          field: error.field,
          message: error.message,
        });
      case 'VariantNotFound':
        return new NotFoundException({
          error: error.kind,
          message: `Variant ${error.sku} not found`,
        });
      case 'InsufficientStock':
        return new ConflictException({
          error: error.kind,
          message: `Not enough stock for ${error.sku}`,
          requested: error.requested,
          available: error.available,
        });
      case 'IdempotencyKeyReused':
        return new UnprocessableEntityException({
          error: error.kind,
          message: 'Idempotency-Key was already used for a different request',
        });
      default:
        return assertNever(error);
    }
  }
}

function markAsReplayed(response: Response): void {
  response.status(HttpStatus.OK).setHeader(IDEMPOTENT_REPLAYED_HEADER, 'true');
}
