import { Global, Module } from '@nestjs/common';
import { Environment } from './schemas/environment.schema';
import { loadEnvironment } from './loaders/load-environment';

@Global()
@Module({
  providers: [{ provide: Environment, useFactory: loadEnvironment }],
  exports: [Environment],
})
export class EnvironmentModule {}
