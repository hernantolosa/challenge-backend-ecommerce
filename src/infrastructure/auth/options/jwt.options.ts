import { type JwtModuleOptions } from '@nestjs/jwt';
import { type Environment } from '@infrastructure/config/schemas/environment.schema';

const ALGORITHM = 'HS256';

export function jwtOptions(environment: Environment): JwtModuleOptions {
  return {
    secret: environment.JWT_SECRET,
    signOptions: {
      algorithm: ALGORITHM,
      issuer: environment.JWT_ISSUER,
      audience: environment.JWT_AUDIENCE,
      expiresIn: '15m',
    },
    verifyOptions: {
      algorithms: [ALGORITHM],
      issuer: environment.JWT_ISSUER,
      audience: environment.JWT_AUDIENCE,
      maxAge: environment.JWT_MAX_AGE_SECONDS,
    },
  };
}
