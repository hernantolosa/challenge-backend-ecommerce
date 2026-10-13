import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { type HealthResponseDto } from '@src/responses/health-response.dto';
import { Public } from '@infrastructure/auth/decorators/public.decorator';

@Controller()
@Public()
@SkipThrottle()
export class AppController {
  @Get('health')
  health(): HealthResponseDto {
    return { status: 'ok' };
  }
}
