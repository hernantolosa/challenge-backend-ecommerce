import { AsyncLocalStorage } from 'node:async_hooks';
import { type TraceContext } from '@infrastructure/logging/interfaces/trace-context.interface';

export class TraceContextStore {
  private readonly storage = new AsyncLocalStorage<TraceContext>();

  run<T>(trace: TraceContext, callback: () => T): T {
    return this.storage.run(trace, callback);
  }

  current(): TraceContext | undefined {
    return this.storage.getStore();
  }
}
