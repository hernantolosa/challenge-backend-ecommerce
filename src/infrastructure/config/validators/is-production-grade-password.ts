const MIN_PRODUCTION_PASSWORD_LENGTH = 16;
const KNOWN_DEFAULT_PASSWORDS: ReadonlySet<string> = new Set([
  'postgres',
  'password',
  'admin',
  'root',
  'changeme',
]);

export function isProductionGradePassword(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    value.length >= MIN_PRODUCTION_PASSWORD_LENGTH &&
    !KNOWN_DEFAULT_PASSWORDS.has(value.toLowerCase())
  );
}
