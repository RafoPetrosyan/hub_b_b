import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetTradeDto {
  @ApiProperty({
    description: 'Trade unique identifier',
    example: '25',
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Trade name',
    example: 'Hair Styling',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Company ID who created the trade',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  creator_company_id?: string;

  @ApiProperty({
    description: 'Whether the trade is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Unique type identifier for the trade group',
    example: '123456-1234-1234-123456'
  })
  @Expose()
  group_id: string

  @ApiProperty({
    description: 'Trade creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Trade last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;
}
