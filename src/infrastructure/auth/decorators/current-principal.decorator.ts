import { unreachable } from '@utils/unreachable';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type AuthenticatedRequest } from '@infrastructure/auth/interfaces/authenticated-request.interface';
import { type Principal } from '@infrastructure/auth/interfaces/principal.interface';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const { principal } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return principal ?? unreachable('CurrentPrincipal requires an authenticated route');
  },
);
