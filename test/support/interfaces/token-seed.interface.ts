export interface TokenSeed {
  readonly subject?: string;
  readonly scopes?: readonly string[];
  readonly secret?: string;
  readonly issuer?: string;
  readonly audience?: string;
  readonly expiresInSeconds?: number;
  readonly issuedSecondsAgo?: number;
  readonly withoutIssuedAt?: boolean;
  readonly withoutExpiry?: boolean;
}
