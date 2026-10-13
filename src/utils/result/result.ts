import { type Err } from './err';
import { type Ok } from './ok';

export type Result<T, E> = Ok<T> | Err<E>;
