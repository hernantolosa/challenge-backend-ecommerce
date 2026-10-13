import { type Failure } from '@utils/result/interfaces/failure.interface';
import { Ok } from '@utils/result/ok';
import { type Result } from '@utils/result/types/result.type';

export function unwrap<T, E extends Failure>(result: Result<T, E>): T {
  if (!(result instanceof Ok)) throw new Error(`Expected Ok but got ${result.kind}`);
  return result.value;
}
