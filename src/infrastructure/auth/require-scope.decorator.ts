import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtScopeGuard } from './jwt-scope.guard';
import { REQUIRED_SCOPE } from './require-scope.metadata';
import { type Scope } from './scope';

export function RequireScope(scope: Scope): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(REQUIRED_SCOPE, scope), UseGuards(JwtScopeGuard));
}
