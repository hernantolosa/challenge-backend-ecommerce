import { type Failure } from '../../src/utils/result/interfaces/failure.interface';
import { Ok } from '../../src/utils/result/ok';
import { type Result } from '../../src/utils/result/types/result.type';

export function unwrap<T, E extends Failure>(result: Result<T, E>): T {
  if (!(result instanceof Ok)) throw new Error(`Expected Ok but got ${result.kind}`);
  return result.value;
}
