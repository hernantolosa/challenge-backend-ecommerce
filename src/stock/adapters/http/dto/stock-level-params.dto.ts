import { IsString, Matches, MaxLength } from 'class-validator';
import {
  SKU_FORMAT_MESSAGE,
  SKU_MAX_LENGTH,
  SKU_PATTERN,
} from '@stock/domain/constants/stock.constants';

const SKU_INPUT_PATTERN = new RegExp(SKU_PATTERN.source, 'i');

export class StockLevelParamsDto {
  @IsString()
  @MaxLength(SKU_MAX_LENGTH)
  @Matches(SKU_INPUT_PATTERN, { message: `sku ${SKU_FORMAT_MESSAGE}` })
  readonly sku!: string;
}
