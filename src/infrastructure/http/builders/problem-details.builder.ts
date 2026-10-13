import { STATUS_CODES } from 'node:http';
import { type ProblemDetails } from '@infrastructure/http/interfaces/problem-details.interface';
import { type ProblemExtensions } from '@infrastructure/http/types/problem-extensions.type';

const UNTYPED_PROBLEM = 'about:blank';

export function buildProblemDetails(
  status: number,
  code: string,
  detail: string,
  extensions: ProblemExtensions = {},
): ProblemDetails {
  return {
    ...extensions,
    type: UNTYPED_PROBLEM,
    title: titleOf(status),
    status,
    detail,
    code,
  };
}

export function titleOf(status: number): string {
  return STATUS_CODES[status] ?? 'Error';
}
