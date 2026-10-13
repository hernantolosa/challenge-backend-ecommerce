import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { REQUIRED_SCOPE } from '@infrastructure/auth/constants/require-scope.metadata';

export function RequireScope(scope: string): CustomDecorator<string> {
  return SetMetadata(REQUIRED_SCOPE, scope);
}
