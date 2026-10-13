import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { JwtScopeGuard } from '@infrastructure/auth/guards/jwt-scope.guard';
import { REQUIRED_SCOPE } from '@infrastructure/auth/constants/require-scope.metadata';
import { type Scope } from '@infrastructure/auth/enums/scope';

export function RequireScope(scope: Scope): MethodDecorator & ClassDecorator {
  return applyDecorators(SetMetadata(REQUIRED_SCOPE, scope), UseGuards(JwtScopeGuard));
}
