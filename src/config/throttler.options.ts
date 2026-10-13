import { type ThrottlerModuleOptions } from '@nestjs/throttler';
import { type Environment } from './environment';

export function throttlerOptions(environment: Environment): ThrottlerModuleOptions {
  return [{ ttl: environment.THROTTLE_TTL_MS, limit: environment.THROTTLE_LIMIT }];
}
