import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { type RawIdempotencyKeyHeader } from '@stock/adapters/inbound/http/interfaces/raw-idempotency-key-header.interface';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RawIdempotencyKeyHeader => ({
    idempotencyKey: context.switchToHttp().getRequest<Request>().header(IDEMPOTENCY_KEY_HEADER),
  }),
);
