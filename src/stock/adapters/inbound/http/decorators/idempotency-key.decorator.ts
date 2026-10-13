import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';

export const IdempotencyKeyHeader = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const key = context.switchToHttp().getRequest<Request>().header('idempotency-key');
    if (key === undefined) throw new BadRequestException('Idempotency-Key header is required');

    return key;
  },
);
