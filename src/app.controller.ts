import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@shared/auth/auth.decorators';

export interface HealthResponseDto {
  readonly status: string;
}

@Controller()
@Public()
@SkipThrottle()
export class AppController {
  @Get('health')
  health(): HealthResponseDto {
    return { status: 'ok' };
  }
}
