import { IsString, Matches } from 'class-validator';
import {
  IDEMPOTENCY_KEY_INPUT_MESSAGE,
  IDEMPOTENCY_KEY_INPUT_PATTERN,
} from '@stock/adapters/inbound/http/constants/input-patterns';

export class IdempotencyKeyHeaderDto {
  @IsString({ message: 'Idempotency-Key header is required' })
  @Matches(IDEMPOTENCY_KEY_INPUT_PATTERN, { message: IDEMPOTENCY_KEY_INPUT_MESSAGE })
  readonly idempotencyKey!: string;
}
