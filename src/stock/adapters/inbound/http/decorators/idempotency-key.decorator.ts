import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key';

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): { idempotencyKey: string | undefined } => ({
    idempotencyKey: context.switchToHttp().getRequest<Request>().header(IDEMPOTENCY_KEY_HEADER),
  }),
);
