import { type PrettyStream } from 'pino-pretty';
import { LogDestination } from './log-destination';

export class PrettyLogDestination extends LogDestination {
  private constructor(private readonly stream: PrettyStream) {
    super();
  }

  static async create(): Promise<PrettyLogDestination> {
    const { build } = await import('pino-pretty');
    return new PrettyLogDestination(
      build({
        colorize: true,
        messageKey: 'message',
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'service,environment,spanId,parentSpanId',
        singleLine: true,
      }),
    );
  }

  write(line: string): void {
    this.stream.write(line);
  }
}
