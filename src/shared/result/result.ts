import { type Err } from './err';
import { type Failure } from './failure';
import { type Ok } from './ok';

export type Result<T, E extends Failure> = Ok<T> | (E extends Failure ? Err<E> : never);
