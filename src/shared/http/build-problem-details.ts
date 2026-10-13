import { STATUS_CODES } from 'node:http';
import { type ProblemDetails } from './problem-details.interface';
import { type ProblemExtensions } from './problem-extensions.type';

export function buildProblemDetails(
  status: number,
  code: string,
  detail: string,
  extensions: ProblemExtensions = {},
): ProblemDetails {
  return { ...extensions, type: 'about:blank', title: titleOf(status), status, detail, code };
}

export function titleOf(status: number): string {
  return STATUS_CODES[status] ?? 'Error';
}
