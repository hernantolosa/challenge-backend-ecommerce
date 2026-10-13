import { ForbiddenException, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpOutcome } from '@infrastructure/http/builders/http-outcome.builder';
import {
  internalErrorProblem,
  toProblemDetails,
} from '@infrastructure/http/converters/to-problem-details.converter';
import { InvariantViolated } from '@utils/errors/invariant-violated.error';

describe('toProblemDetails', () => {
  it('keeps the problem built from a business failure', () => {
    const failure = InvariantViolated.make('quantity', 'must be positive');

    expect(toProblemDetails(HttpOutcome.badRequest(failure, failure.message))).toEqual({
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'must be positive',
      code: 'InvariantViolated',
    });
  });

  it('keeps extensions without letting them override the standard members', () => {
    const failure = InvariantViolated.make('sku', 'invalid');

    const problem = toProblemDetails(
      HttpOutcome.conflict(failure, 'conflict', { status: 200, available: 3 }),
    );

    expect(problem).toMatchObject({ status: 409, available: 3 });
  });

  it('converts framework exceptions', () => {
    expect(toProblemDetails(new ForbiddenException('Insufficient scope'))).toEqual({
      type: 'about:blank',
      title: 'Forbidden',
      status: 403,
      detail: 'Insufficient scope',
      code: 'Forbidden',
    });
  });

  it('falls back to the status title when an exception has no message', () => {
    expect(toProblemDetails(new NotFoundException())).toMatchObject({
      status: 404,
      detail: 'Not Found',
    });
  });

  it('converts exposable http errors raised by middleware', () => {
    const tooLarge = { status: 413, message: 'request entity too large', expose: true };

    expect(toProblemDetails(tooLarge)).toMatchObject({ status: 413, code: 'PayloadTooLarge' });
  });

  it.each([
    ['a plain error', new Error('connection refused at 10.0.0.5:5432')],
    ['a non exposable http error', { status: 500, message: 'secret', expose: false }],
    ['a thrown string', 'boom'],
  ])('returns nothing for %s so it is reported as an internal error', (_case, exception) => {
    expect(toProblemDetails(exception)).toBeNull();
  });
});

describe('internalErrorProblem', () => {
  it('describes an internal error without any detail about the cause', () => {
    expect(internalErrorProblem()).toEqual({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred',
      code: 'InternalServerError',
    });
  });
});
