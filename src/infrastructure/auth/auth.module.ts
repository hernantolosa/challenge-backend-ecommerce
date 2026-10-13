import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Environment } from '../config/environment';
import { JwtScopeGuard } from './jwt-scope.guard';
import { jwtOptions } from './jwt.options';

@Module({
  imports: [JwtModule.registerAsync({ inject: [Environment], useFactory: jwtOptions })],
  providers: [JwtScopeGuard],
  exports: [JwtModule, JwtScopeGuard],
})
export class AuthModule {}
