export const SKU_MAX_LENGTH = 64;
export const SKU_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
export const SKU_FORMAT_MESSAGE = 'must contain only letters, digits and single hyphens';
export const SKU_LENGTH_MESSAGE = `must have between 1 and ${SKU_MAX_LENGTH} characters`;
