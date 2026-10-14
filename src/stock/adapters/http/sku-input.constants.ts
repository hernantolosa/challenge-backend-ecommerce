import { SKU_PATTERN } from '@stock/domain/constants/stock.constants';

export const SKU_INPUT_PATTERN = new RegExp(SKU_PATTERN.source, 'i');
