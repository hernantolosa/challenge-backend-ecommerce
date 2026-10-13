import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { REQUIRED_SCOPE } from '@infrastructure/auth/constants/require-scope.metadata';
import { type Scope } from '@infrastructure/auth/enums/scope';

export function RequireScope(scope: Scope): CustomDecorator<string> {
  return SetMetadata(REQUIRED_SCOPE, scope);
}
