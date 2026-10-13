import { type SerializedError } from '@infrastructure/logging/interfaces/serialized-error.interface';

export function serializeError(error: Error): SerializedError {
  return {
    type: error.constructor.name,
    message: error.message,
    stack: error.stack ?? null,
    code: codeOf(error),
  };
}

function codeOf(error: Error): string | null {
  return 'code' in error && typeof error.code === 'string' ? error.code : null;
}
