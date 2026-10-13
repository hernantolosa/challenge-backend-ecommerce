import { Ok, type Err, type Failure } from '@shared/result';

export function unwrap<T>(result: Ok<T> | Err<Failure>): T {
  if (!(result instanceof Ok)) throw new Error(`Expected Ok but got ${result.kind}`);
  return result.value;
}
