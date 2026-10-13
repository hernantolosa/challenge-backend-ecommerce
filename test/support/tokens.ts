import { JwtService } from '@nestjs/jwt';
import { StockScope } from '@stock/http/stock.scopes';
import { ACTOR } from '@test/fixtures/stock.fixtures';

export interface TokenSeed {
  readonly subject?: string;
  readonly scopes?: readonly string[];
  readonly secret?: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly expiresInSeconds?: number;
  readonly withoutExpiry?: boolean;
}

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
  const expiresAt = nowInSeconds() + (seed.expiresInSeconds ?? DEFAULT_LIFETIME_SECONDS);

  return {
    scope: (seed.scopes ?? [StockScope.READ, StockScope.WRITE]).join(' '),
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
  });
}

export function forgeUnsignedToken(): string {
  const encode = (value: object): string =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'none', typ: 'JWT' });
  const payload = encode({
    sub: ACTOR,
    scope: StockScope.WRITE,
    iss: requiredEnv('JWT_ISSUER'),
    aud: requiredEnv('JWT_AUDIENCE'),
    iat: nowInSeconds(),
    exp: nowInSeconds() + DEFAULT_LIFETIME_SECONDS,
  });
  return `${header}.${payload}.`;
}
