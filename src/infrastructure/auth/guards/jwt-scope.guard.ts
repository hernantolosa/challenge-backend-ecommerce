import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { principalFromClaims } from '@infrastructure/auth/claims/principal-from-claims';
import { PUBLIC_ROUTE } from '@infrastructure/auth/constants/public-route.metadata';
import { REQUIRED_SCOPE } from '@infrastructure/auth/constants/require-scope.metadata';
import { type Scope } from '@infrastructure/auth/enums/scope';
import { type AuthenticatedRequest } from '@infrastructure/auth/interfaces/authenticated-request.interface';
import { type Principal } from '@infrastructure/auth/interfaces/principal.interface';
import { unreachable } from '@utils/unreachable';

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const AUTHENTICATION_REQUIRED = 'Authentication required';

@Injectable()
export class JwtScopeGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.authenticateBearerToken(request.headers.authorization);

    if (!principal.scopes.has(this.requiredScopeOf(context))) {
      throw new ForbiddenException('Insufficient scope');
    }

    request.principal = principal;
    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return this.metadataOf<boolean>(PUBLIC_ROUTE, context) === true;
  }

  private requiredScopeOf(context: ExecutionContext): Scope {
    return (
      this.metadataOf<Scope>(REQUIRED_SCOPE, context) ??
      unreachable('every route must declare @RequireScope or @Public')
    );
  }

  private metadataOf<T>(key: string, context: ExecutionContext): T | undefined {
    return this.reflector.getAllAndOverride<T | undefined>(key, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private async authenticateBearerToken(authorization: string | undefined): Promise<Principal> {
    const token = BEARER_PATTERN.exec(authorization ?? '')?.[1];
    if (token === undefined) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);

    const principal = principalFromClaims(await this.verifyToken(token));
    if (principal === null) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);

    return principal;
  }

  private async verifyToken(token: string): Promise<unknown> {
    try {
      return await this.jwt.verifyAsync<object>(token);
    } catch {
      throw new UnauthorizedException(AUTHENTICATION_REQUIRED);
    }
  }
}
