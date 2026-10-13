export const SKU_MAX_LENGTH = 64;
export const SKU_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
export const SKU_FORMAT_MESSAGE = 'must contain only letters, digits and single hyphens';
export const SKU_LENGTH_MESSAGE = `must have between 1 and ${SKU_MAX_LENGTH} characters`;

export const MIN_MOVEMENT_QUANTITY = 1;
export const MAX_MOVEMENT_QUANTITY = 100_000;
export const QUANTITY_RANGE_MESSAGE = `must be an integer between ${MIN_MOVEMENT_QUANTITY} and ${MAX_MOVEMENT_QUANTITY}`;

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const IDEMPOTENCY_KEY_FORMAT_MESSAGE = 'must be a valid UUID';

export const MAX_STOCK_LEVEL = 2_147_483_647;
