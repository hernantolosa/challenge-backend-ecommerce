import { type MemoryLogDestination, type LogEntry } from '@test/fakes/memory-log-destination';

const TIMEOUT_MS = 2_000;

export function waitForLog(
  logs: MemoryLogDestination,
  matches: (entry: LogEntry) => boolean,
): Promise<LogEntry> {
  const written = logs.entries().find(matches);
  if (written !== undefined) {
    return Promise.resolve(written);
  }

  return new Promise<LogEntry>((resolve, reject) => {
    const stopListening = logs.onWrite((entry) => {
      if (!matches(entry)) {
        return;
      }
      clearTimeout(timeout);
      stopListening();
      resolve(entry);
    });
    const timeout = setTimeout(() => {
      stopListening();
      reject(new Error('Expected log entry was not written'));
    }, TIMEOUT_MS);
  });
}
