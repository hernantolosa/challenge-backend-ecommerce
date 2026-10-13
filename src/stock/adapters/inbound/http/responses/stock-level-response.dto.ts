import { type StockLevelDto } from '@stock/application/dto/stock-level.dto';

export class StockLevelResponseDto {
  private constructor(
    readonly sku: string,
    readonly onHand: number,
  ) {}

  static from(dto: StockLevelDto): StockLevelResponseDto {
    return new StockLevelResponseDto(dto.sku, dto.onHand);
  }
}
