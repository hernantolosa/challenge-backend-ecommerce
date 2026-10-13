export abstract class LogDestination {
  abstract write(line: string): void;
}

export class StdoutLogDestination extends LogDestination {
  write(line: string): void {
    process.stdout.write(line);
  }
}
