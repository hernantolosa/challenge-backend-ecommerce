import { LogDestination } from './log-destination';

export class StdoutLogDestination extends LogDestination {
  write(line: string): void {
    process.stdout.write(line);
  }
}
