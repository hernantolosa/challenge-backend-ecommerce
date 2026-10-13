import { SKU_FORMAT_MESSAGE, SKU_PATTERN } from '@shared-kernel/constants/sku.constants';
import {
  IDEMPOTENCY_KEY_FORMAT_MESSAGE,
  UUID_PATTERN,
} from '@stock/domain/constants/idempotency-key.constants';

export const SKU_INPUT_PATTERN = new RegExp(SKU_PATTERN.source, 'i');
export const IDEMPOTENCY_KEY_INPUT_PATTERN = new RegExp(UUID_PATTERN.source, 'i');

export const SKU_INPUT_MESSAGE = `sku ${SKU_FORMAT_MESSAGE}`;
export const IDEMPOTENCY_KEY_INPUT_MESSAGE = `Idempotency-Key ${IDEMPOTENCY_KEY_FORMAT_MESSAGE}`;
