import { type Response } from 'express';
import { type TraceContext } from '@infrastructure/logging/interfaces/trace-context.interface';

const NANOSECONDS_PER_MILLISECOND = 1_000_000;

export class RequestLogState {
  private static readonly states = new WeakMap<Response, RequestLogState>();
  private outcomeCode: string | null = null;

  private constructor(
    readonly trace: TraceContext,
    private readonly startedAt: bigint,
  ) {}

  static start(response: Response, trace: TraceContext): RequestLogState {
    const state = new RequestLogState(trace, process.hrtime.bigint());
    RequestLogState.states.set(response, state);
    return state;
  }

  static of(response: Response): RequestLogState | undefined {
    return RequestLogState.states.get(response);
  }

  recordOutcome(code: string): void {
    this.outcomeCode = code;
  }

  get outcome(): string | null {
    return this.outcomeCode;
  }

  elapsedMilliseconds(): number {
    const elapsed = Number(process.hrtime.bigint() - this.startedAt);
    return Math.round((elapsed / NANOSECONDS_PER_MILLISECOND) * 100) / 100;
  }
}
