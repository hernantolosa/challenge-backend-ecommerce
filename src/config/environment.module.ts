import { Global, Module } from '@nestjs/common';
import { Environment, loadEnvironment } from './environment';

@Global()
@Module({
  providers: [{ provide: Environment, useFactory: loadEnvironment }],
  exports: [Environment],
})
export class EnvironmentModule {}
