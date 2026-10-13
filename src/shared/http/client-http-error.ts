export interface ClientHttpError {
  readonly status: number;
  readonly message: string;
  readonly expose: true;
}
