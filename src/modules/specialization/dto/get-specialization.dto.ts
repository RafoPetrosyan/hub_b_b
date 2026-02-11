import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetBaseSpecializationDto {
  @ApiProperty({
    description: 'Specialization unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Specialization name',
    example: 'Fine Line',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Trade ID',
    example: 1,
  })
  @Expose()
  trade_id: number;

  @ApiProperty({
    description: 'Whether the specialization is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Specialization creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Specialization last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;
}

