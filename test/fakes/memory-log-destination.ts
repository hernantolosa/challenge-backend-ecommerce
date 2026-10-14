import { LogDestination } from '@shared/logging/log-destination';

export type LogEntry = Readonly<Record<string, unknown>>;

export type LogListener = (entry: LogEntry) => void;

export class MemoryLogDestination extends LogDestination {
  private readonly lines: string[] = [];
  private readonly listeners = new Set<LogListener>();

  write(line: string): void {
    this.lines.push(line);
    const entry = parseLogLine(line);
    this.listeners.forEach((listener) => listener(entry));
  }

  get raw(): string {
    return this.lines.join('');
  }

  entries(): LogEntry[] {
    return this.lines.map(parseLogLine);
  }

  onWrite(listener: LogListener): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  clear(): void {
    this.lines.length = 0;
  }
}

function parseLogLine(line: string): LogEntry {
  const parsed: unknown = JSON.parse(line);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Invalid log line: ${line}`);
  }

  return parsed as LogEntry;
}
