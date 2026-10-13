import { type Principal } from '@infrastructure/auth/interfaces/principal.interface';
import { type RequiredClaims } from '@infrastructure/auth/interfaces/required-claims.interface';

const PRINTABLE_SUBJECT = /^[^\p{Cc}]{1,255}$/u;

export function principalFromClaims(payload: unknown): Principal | null {
  if (!hasRequiredClaims(payload)) return null;

  return {
    subject: payload.sub,
    scopes: new Set(payload.scope.split(' ').filter((scope) => scope.length > 0)),
  };
}

function hasRequiredClaims(payload: unknown): payload is RequiredClaims {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    isValidSubject(payload.sub) &&
    'scope' in payload &&
    typeof payload.scope === 'string' &&
    'exp' in payload &&
    typeof payload.exp === 'number'
  );
}

function isValidSubject(subject: unknown): subject is string {
  return typeof subject === 'string' && PRINTABLE_SUBJECT.test(subject);
}
