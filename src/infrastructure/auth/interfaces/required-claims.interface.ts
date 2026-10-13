export interface RequiredClaims {
  readonly sub: string;
  readonly scope: string;
  readonly exp: number;
  readonly iat: number;
}
