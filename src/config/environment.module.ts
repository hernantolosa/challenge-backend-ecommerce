import { Global, Module } from '@nestjs/common';
import { Environment } from './environment.schema';
import { loadEnvironment } from './load-environment';

@Global()
@Module({
  providers: [{ provide: Environment, useFactory: loadEnvironment }],
  exports: [Environment],
})
export class EnvironmentModule {}
