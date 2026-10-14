import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Environment } from '@config/environment.schema';
import { jwtOptions } from './jwt.options';

@Module({
  imports: [JwtModule.registerAsync({ inject: [Environment], useFactory: jwtOptions })],
  exports: [JwtModule],
})
export class AuthModule {}
