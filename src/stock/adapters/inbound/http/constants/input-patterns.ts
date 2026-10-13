import { UUID_PATTERN } from '@stock/domain/value-objects/idempotency-key';
import { SKU_PATTERN } from '@stock/domain/value-objects/sku';

export const SKU_INPUT_PATTERN = new RegExp(SKU_PATTERN.source, 'i');
export const IDEMPOTENCY_KEY_INPUT_PATTERN = new RegExp(UUID_PATTERN.source, 'i');

export const SKU_FORMAT_MESSAGE = 'sku must contain only letters, digits and single hyphens';
export const IDEMPOTENCY_KEY_FORMAT_MESSAGE = 'Idempotency-Key must be a valid UUID';
