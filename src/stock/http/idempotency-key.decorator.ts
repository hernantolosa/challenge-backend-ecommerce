import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

export interface RawIdempotencyKeyHeader {
  readonly idempotencyKey: string | undefined;
}

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RawIdempotencyKeyHeader => ({
    idempotencyKey: context.switchToHttp().getRequest<Request>().header('idempotency-key'),
  }),
);
