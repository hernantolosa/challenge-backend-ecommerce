import { Global, Module } from '@nestjs/common';
import { Environment } from '@infrastructure/config/schemas/environment.schema';
import { loadEnvironment } from '@infrastructure/config/loaders/load-environment';

@Global()
@Module({
  providers: [{ provide: Environment, useFactory: loadEnvironment }],
  exports: [Environment],
})
export class EnvironmentModule {}
