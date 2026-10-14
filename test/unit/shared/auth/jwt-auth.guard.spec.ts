import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { JwtService } from '@nestjs/jwt';
import { type Environment } from '@config/environment.schema';
import { Public, RequireScope } from '@shared/auth/auth.decorators';
import { type AuthenticatedRequest } from '@shared/auth/authenticated-request.interface';
import { JwtAuthGuard } from '@shared/auth/jwt-auth.guard';
import { jwtOptions } from '@shared/auth/jwt.options';
import { VALID_ENVIRONMENT } from '@test/fixtures/environment.fixtures';
import { issueToken, type TokenSeed } from '@test/support/tokens';

const ENVIRONMENT = VALID_ENVIRONMENT as unknown as Environment;
const READ_SCOPE = 'stock:read';

class Routes {
  @RequireScope(READ_SCOPE)
  scoped(): string {
    return 'scoped';
  }

  undeclared(): string {
    return 'undeclared';
  }

  @Public()
  open(): string {
    return 'open';
  }
}

function aToken(seed: TokenSeed = {}): string {
  return issueToken({
    secret: ENVIRONMENT.JWT_SECRET,
    issuer: ENVIRONMENT.JWT_ISSUER,
    audience: ENVIRONMENT.JWT_AUDIENCE,
    scopes: [READ_SCOPE],
    ...seed,
  });
}

function aRequest(token?: string): AuthenticatedRequest {
  const authorization = token === undefined ? {} : { authorization: `Bearer ${token}` };
  return { headers: authorization } as AuthenticatedRequest;
}

function aContext(route: keyof Routes, request: AuthenticatedRequest): ExecutionContextHost {
  return new ExecutionContextHost([request], Routes, Routes.prototype[route]);
}

describe('JwtAuthGuard', () => {
  const guard = new JwtAuthGuard(new JwtService(jwtOptions(ENVIRONMENT)), new Reflector());

  it('admits a token carrying the scope the route requires', async () => {
    const request = aRequest(aToken({ subject: 'operator-7' }));

    await expect(guard.canActivate(aContext('scoped', request))).resolves.toBe(true);
    expect(request.principal?.subject).toBe('operator-7');
  });

  it('rejects a request without a token', async () => {
    await expect(guard.canActivate(aContext('scoped', aRequest()))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token missing the required scope', async () => {
    const request = aRequest(aToken({ scopes: ['stock:write'] }));

    await expect(guard.canActivate(aContext('scoped', request))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('fails closed on a route that declares neither a scope nor @Public', async () => {
    const request = aRequest(aToken());

    await expect(guard.canActivate(aContext('undeclared', request))).rejects.toThrow(
      /must declare @RequireScope or @Public/,
    );
    expect(request.principal).toBeUndefined();
  });

  it('lets a public route through without a token', async () => {
    await expect(guard.canActivate(aContext('open', aRequest()))).resolves.toBe(true);
  });
});
