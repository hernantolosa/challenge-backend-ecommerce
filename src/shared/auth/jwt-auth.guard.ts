import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { unreachable } from '@shared/result';
import { PUBLIC_ROUTE, REQUIRED_SCOPE } from './auth.decorators';
import { type AuthenticatedRequest, type Principal } from './principal';

interface RequiredClaims {
  readonly sub: string;
  readonly scope: string;
  readonly exp: number;
}

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/;
const PRINTABLE_SUBJECT = /^[^\p{Cc}]{1,255}$/u;
const AUTHENTICATION_REQUIRED = 'Authentication required';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.metadataOf<boolean>(PUBLIC_ROUTE, context) === true) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = await this.authenticate(request.headers.authorization);

    if (!principal.scopes.has(this.requiredScopeOf(context))) {
      throw new ForbiddenException('Insufficient scope');
    }

    request.principal = principal;
    return true;
  }

  private requiredScopeOf(context: ExecutionContext): string {
    return (
      this.metadataOf<string>(REQUIRED_SCOPE, context) ??
      unreachable('every route must declare @RequireScope or @Public')
    );
  }

  private metadataOf<T>(key: string, context: ExecutionContext): T | undefined {
    return this.reflector.getAllAndOverride<T | undefined>(key, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  private async authenticate(authorization: string | undefined): Promise<Principal> {
    const token = BEARER_PATTERN.exec(authorization ?? '')?.[1];
    if (token === undefined) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);

    const claims = await this.verify(token);
    if (!hasRequiredClaims(claims)) throw new UnauthorizedException(AUTHENTICATION_REQUIRED);

    return {
      subject: claims.sub,
      scopes: new Set(claims.scope.split(' ').filter((scope) => scope.length > 0)),
    };
  }

  private async verify(token: string): Promise<unknown> {
    try {
      return await this.jwt.verifyAsync<object>(token);
    } catch {
      throw new UnauthorizedException(AUTHENTICATION_REQUIRED);
    }
  }
}

function hasRequiredClaims(payload: unknown): payload is RequiredClaims {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    typeof payload.sub === 'string' &&
    PRINTABLE_SUBJECT.test(payload.sub) &&
    'scope' in payload &&
    typeof payload.scope === 'string' &&
    'exp' in payload &&
    typeof payload.exp === 'number'
  );
}
