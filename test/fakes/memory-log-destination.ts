import { LogDestination } from '@infrastructure/logging/logger/log-destination';
import { type LogEntry } from '@test/support/log-entry.type';

export class MemoryLogDestination extends LogDestination {
  private readonly lines: string[] = [];

  write(line: string): void {
    this.lines.push(line);
  }

  get raw(): string {
    return this.lines.join('');
  }

  entries(): LogEntry[] {
    return this.lines.map(parseLogLine);
  }

  clear(): void {
    this.lines.length = 0;
  }
}

function parseLogLine(line: string): LogEntry {
  const parsed: unknown = JSON.parse(line);
  if (typeof parsed !== 'object' || parsed === null) throw new Error(`Invalid log line: ${line}`);

  return parsed as LogEntry;
}
