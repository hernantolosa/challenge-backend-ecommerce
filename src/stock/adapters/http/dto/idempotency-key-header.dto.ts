import { IsString } from 'class-validator';

export class IdempotencyKeyHeaderDto {
  @IsString({ message: 'Idempotency-Key header is required' })
  readonly idempotencyKey!: string;
}
