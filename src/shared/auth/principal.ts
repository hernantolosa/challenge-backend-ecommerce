export interface Principal {
  readonly subject: string;
  readonly scopes: ReadonlySet<string>;
}
