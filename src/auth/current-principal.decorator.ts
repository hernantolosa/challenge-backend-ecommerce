import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type AuthenticatedRequest, type Principal } from './principal';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const { principal } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (principal === undefined) throw new Error('CurrentPrincipal requires @RequireScope');

    return principal;
  },
);
