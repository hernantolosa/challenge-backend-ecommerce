import { SetMetadata, type CustomDecorator } from '@nestjs/common';
import { PUBLIC_ROUTE } from '@infrastructure/auth/constants/public-route.metadata';

export function Public(): CustomDecorator<string> {
  return SetMetadata(PUBLIC_ROUTE, true);
}
