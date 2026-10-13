import {
  createParamDecorator,
  SetMetadata,
  type CustomDecorator,
  type ExecutionContext,
} from '@nestjs/common';
import { unreachable } from '@shared/result/match';
import { type AuthenticatedRequest } from './authenticated-request.interface';
import { type Principal } from './principal.interface';

export const PUBLIC_ROUTE = 'auth:public-route';
export const REQUIRED_SCOPE = 'auth:required-scope';

export function Public(): CustomDecorator<string> {
  return SetMetadata(PUBLIC_ROUTE, true);
}

export function RequireScope(scope: string): CustomDecorator<string> {
  return SetMetadata(REQUIRED_SCOPE, scope);
}

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Principal => {
    const { principal } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return principal ?? unreachable('CurrentPrincipal requires an authenticated route');
  },
);
