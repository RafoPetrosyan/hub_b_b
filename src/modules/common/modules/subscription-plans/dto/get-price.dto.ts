import { ApiProperty } from '@nestjs/swagger';

export class GetPriceDto {
  @ApiProperty({
    description: 'Base price in cents (before any promotions)',
    example: 9999,
  })
  base_price_cents: number;

  @ApiProperty({
    description: 'Final price in cents (after applying best promotion)',
    example: 7999,
  })
  final_price_cents: number;
}

