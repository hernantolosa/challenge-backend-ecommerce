export interface SerializedError {
  readonly type: string;
  readonly message: string;
  readonly stack: string | null;
  readonly code: string | null;
}
