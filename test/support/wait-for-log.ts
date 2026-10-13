import { type MemoryLogDestination } from '@test/fakes/memory-log-destination';
import { type LogEntry } from './log-entry.type';

const TIMEOUT_MS = 1_000;

export async function waitForLog(
  logs: MemoryLogDestination,
  matches: (entry: LogEntry) => boolean,
): Promise<LogEntry> {
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    const entry = logs.entries().find(matches);
    if (entry !== undefined) return entry;
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error('Expected log entry was not written');
}
