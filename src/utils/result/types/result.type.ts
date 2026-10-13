import { type Err } from '@utils/result/err';
import { type Failure } from '@utils/result/interfaces/failure.interface';
import { type Ok } from '@utils/result/ok';

export type Result<T, E extends Failure> = Ok<T> | (E extends Failure ? Err<E> : never);
