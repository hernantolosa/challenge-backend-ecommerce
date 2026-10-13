import { Ok } from '@shared/result/ok';
import { type Err } from '@shared/result/err';
import { type Failure } from '@shared/result/failure';

export function unwrap<T>(result: Ok<T> | Err<Failure>): T {
  if (!(result instanceof Ok)) throw new Error(`Expected Ok but got ${result.kind}`);
  return result.value;
}
