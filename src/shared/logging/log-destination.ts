export abstract class LogDestination {
  abstract write(line: string): void;
}
