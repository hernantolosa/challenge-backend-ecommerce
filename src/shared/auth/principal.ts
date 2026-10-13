import { type Request } from 'express';

export interface Principal {
  readonly subject: string;
  readonly scopes: ReadonlySet<string>;
}

export interface AuthenticatedRequest extends Request {
  principal?: Principal;
}
