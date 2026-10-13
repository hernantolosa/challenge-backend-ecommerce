import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@Controller()
@SkipThrottle()
export class AppController {
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
