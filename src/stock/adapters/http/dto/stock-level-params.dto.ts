import { IsString } from 'class-validator';

export class StockLevelParamsDto {
  @IsString()
  readonly sku!: string;
}
