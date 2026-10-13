import { JwtService } from '@nestjs/jwt';
import { Scope } from '@infrastructure/auth/enums/scope';
import { ACTOR } from '@test/fixtures/stock.fixtures';
import { type TokenSeed } from './interfaces/token-seed.interface';

const DEFAULT_LIFETIME_SECONDS = 300;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) throw new Error(`Missing test environment variable ${name}`);
  return value;
}

function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function claimsOf(seed: TokenSeed): Record<string, unknown> {
  const issuedAt = nowInSeconds() - (seed.issuedSecondsAgo ?? 0);
  const expiresAt = nowInSeconds() + (seed.expiresInSeconds ?? DEFAULT_LIFETIME_SECONDS);

  return {
    scope: (seed.scopes ?? [Scope.STOCK_READ, Scope.STOCK_WRITE]).join(' '),
    ...(seed.withoutIssuedAt === true ? {} : { iat: issuedAt }),
    ...(seed.withoutExpiry === true ? {} : { exp: expiresAt }),
  };
}

export function issueToken(seed: TokenSeed = {}): string {
  return new JwtService().sign(claimsOf(seed), {
    secret: seed.secret ?? requiredEnv('JWT_SECRET'),
    algorithm: 'HS256',
    subject: seed.subject ?? ACTOR,
    issuer: seed.issuer ?? requiredEnv('JWT_ISSUER'),
    audience: seed.audience ?? requiredEnv('JWT_AUDIENCE'),
    noTimestamp: seed.withoutIssuedAt === true,
  });
}

export function forgeUnsignedToken(): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    sub: ACTOR,
    scope: Scope.STOCK_WRITE,
    iss: requiredEnv('JWT_ISSUER'),
    aud: requiredEnv('JWT_AUDIENCE'),
    iat: nowInSeconds(),
    exp: nowInSeconds() + DEFAULT_LIFETIME_SECONDS,
  });
  return `${header}.${payload}.`;
}
