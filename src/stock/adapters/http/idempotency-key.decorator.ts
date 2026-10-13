import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { type RawIdempotencyKeyHeaderDto } from '@stock/adapters/http/dto/raw-idempotency-key-header.dto';

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RawIdempotencyKeyHeaderDto => ({
    idempotencyKey: context.switchToHttp().getRequest<Request>().header('idempotency-key'),
  }),
);
