import { JwtService } from '@nestjs/jwt';
import { Scope } from '@infrastructure/auth/enums/scope';
import { ACTOR } from '@test/fixtures/stock.fixtures';

export interface TokenSeed {
  readonly subject?: string;
  readonly scopes?: readonly string[];
  readonly secret?: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly expiresInSeconds?: number;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined) throw new Error(`Missing test environment variable ${name}`);
  return value;
}

export function issueToken(seed: TokenSeed = {}): string {
  return new JwtService().sign(
    { scope: (seed.scopes ?? [Scope.STOCK_READ, Scope.STOCK_WRITE]).join(' ') },
    {
      secret: seed.secret ?? requiredEnv('JWT_SECRET'),
      algorithm: 'HS256',
      subject: seed.subject ?? ACTOR,
      issuer: seed.issuer ?? requiredEnv('JWT_ISSUER'),
      audience: seed.audience ?? requiredEnv('JWT_AUDIENCE'),
      expiresIn: seed.expiresInSeconds ?? 300,
    },
  );
}

export function issueTokenWithoutExpiry(): string {
  return new JwtService().sign(
    { scope: Scope.STOCK_WRITE },
    {
      secret: requiredEnv('JWT_SECRET'),
      algorithm: 'HS256',
      subject: ACTOR,
      issuer: requiredEnv('JWT_ISSUER'),
      audience: requiredEnv('JWT_AUDIENCE'),
    },
  );
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
    exp: Math.floor(Date.now() / 1000) + 300,
  });
  return `${header}.${payload}.`;
}
