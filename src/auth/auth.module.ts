import { Module } from '@nestjs/common';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { Environment } from '../config/environment';
import { JwtScopeGuard } from './jwt-scope.guard';

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
    },
  };
}

@Module({
  imports: [JwtModule.registerAsync({ inject: [Environment], useFactory: jwtOptions })],
  providers: [JwtScopeGuard],
  exports: [JwtModule, JwtScopeGuard],
})
export class AuthModule {}
