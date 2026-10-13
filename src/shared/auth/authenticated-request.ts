import { type Request } from 'express';
import { type Principal } from './principal';

export interface AuthenticatedRequest extends Request {
  principal?: Principal;
}
