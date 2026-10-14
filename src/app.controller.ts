import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '@shared/auth/auth.decorators';
import { type HealthResponseDto } from './health-response.dto';

@Controller()
@SkipThrottle()
export class AppController {
  @Get('health')
  @Public()
  health(): HealthResponseDto {
    return { status: 'ok' };
  }
}
