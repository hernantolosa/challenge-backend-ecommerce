import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { type AuthenticatedRequest } from '@infrastructure/auth/interfaces/authenticated-request.interface';
import { type Principal } from '@infrastructure/auth/interfaces/principal.interface';
import { REQUIRED_SCOPE } from '@infrastructure/auth/constants/require-scope.metadata';
import { type Scope } from '@infrastructure/auth/enums/scope';
import { principalFromClaims } from '@infrastructure/auth/claims/principal-from-claims';

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;

@Injectable()
export class JwtScopeGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.authenticateBearerToken(request.headers.authorization);

    if (!principal.scopes.has(this.requiredScopeOf(context))) {
      throw new ForbiddenException('Insufficient scope');
    }

    request.principal = principal;
    return true;
  }

  private async authenticateBearerToken(authorization: string | undefined): Promise<Principal> {
    const token = BEARER_PATTERN.exec(authorization ?? '')?.[1];
    if (token === undefined) throw new UnauthorizedException('Missing bearer token');

    const principal = principalFromClaims(await this.verifyToken(token));
    if (principal === null) throw new UnauthorizedException('Invalid token claims');

    return principal;
  }

  private async verifyToken(token: string): Promise<unknown> {
    try {
      return await this.jwt.verifyAsync<object>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private requiredScopeOf(context: ExecutionContext): Scope {
    const scope = this.reflector.get<Scope | undefined>(REQUIRED_SCOPE, context.getHandler());
    if (scope === undefined) throw new Error('JwtScopeGuard requires @RequireScope');

    return scope;
  }
}
