import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Environment } from '../config/schemas/environment.schema';
import { JwtScopeGuard } from './guards/jwt-scope.guard';
import { jwtOptions } from './options/jwt.options';

@Module({
  imports: [JwtModule.registerAsync({ inject: [Environment], useFactory: jwtOptions })],
  providers: [JwtScopeGuard],
  exports: [JwtModule, JwtScopeGuard],
})
export class AuthModule {}
