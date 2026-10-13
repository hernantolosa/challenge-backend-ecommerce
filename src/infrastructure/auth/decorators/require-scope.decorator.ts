import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtScopeGuard } from '../guards/jwt-scope.guard';
import { REQUIRED_SCOPE } from '../constants/require-scope.metadata';
import { type Scope } from '../enums/scope';

export function RequireScope(scope: Scope): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(REQUIRED_SCOPE, scope), UseGuards(JwtScopeGuard));
}
