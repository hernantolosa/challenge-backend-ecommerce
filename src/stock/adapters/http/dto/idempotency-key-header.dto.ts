import { IsString, Matches } from 'class-validator';
import { IDEMPOTENCY_KEY_FORMAT_MESSAGE, UUID_PATTERN } from '@stock/domain/stock.constants';

const IDEMPOTENCY_KEY_INPUT_PATTERN = new RegExp(UUID_PATTERN.source, 'i');

export class IdempotencyKeyHeaderDto {
  @IsString({ message: 'Idempotency-Key header is required' })
  @Matches(IDEMPOTENCY_KEY_INPUT_PATTERN, {
    message: `Idempotency-Key ${IDEMPOTENCY_KEY_FORMAT_MESSAGE}`,
  })
  readonly idempotencyKey!: string;
}
