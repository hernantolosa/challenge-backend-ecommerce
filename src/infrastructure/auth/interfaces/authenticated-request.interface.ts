import { type Request } from 'express';
import { type Principal } from './principal.interface';

export interface AuthenticatedRequest extends Request {
  principal?: Principal;
}
