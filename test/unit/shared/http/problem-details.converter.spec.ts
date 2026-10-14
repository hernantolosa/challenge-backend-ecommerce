import { aQueryFailure } from '@test/fixtures/database-failure.fixtures';
import { ForbiddenException, HttpStatus, NotFoundException } from '@nestjs/common';
import { ProblemException } from '@shared/http/problem.exception';
import { internalErrorProblem, toProblemDetails } from '@shared/http/problem-details.converter';
import { InvariantViolated } from '@shared/errors/invariant-violated.error';

describe('toProblemDetails', () => {
  it('keeps the problem built from a business failure', () => {
    const failure = InvariantViolated.make('quantity', 'must be positive');

    expect(toProblemDetails(ProblemException.badRequest(failure, failure.message))).toEqual({
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
      ProblemException.conflict(failure, 'conflict', { status: 200, available: 3 }),
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

describe('toProblemDetails for database unavailability', () => {
  it.each([
    ['a lock timeout', aQueryFailure('55P03')],
    ['a statement timeout', aQueryFailure('57014')],
    ['a pool acquire timeout', new Error('timeout exceeded when trying to connect')],
    ['a connection timeout', new Error('Connection terminated due to connection timeout')],
  ])('answers 503 for %s', (_case, exception) => {
    expect(toProblemDetails(exception)).toMatchObject({
      status: 503,
      code: 'ServiceUnavailable',
      detail: 'The service is busy, retry later',
    });
  });

  it('keeps other database failures as internal errors', () => {
    expect(toProblemDetails(aQueryFailure('23502'))).toBeNull();
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
