import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Environment } from '@config/environment.schema';
import { JwtAuthGuard } from './jwt-auth.guard';
import { jwtOptions } from './jwt.options';

@Module({
  imports: [JwtModule.registerAsync({ inject: [Environment], useFactory: jwtOptions })],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
