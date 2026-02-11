import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetBusinessSpecializationDto {
  @ApiProperty({
    description: 'Specialization unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Business ID',
    example: 1,
  })
  @Expose()
  business_id: string;

  @ApiProperty({
    description: 'Specialization name',
    example: 'Custom Fine Line',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Whether the specialization is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Whether the specialization is archived',
    example: false,
  })
  @Expose()
  archived: boolean;

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


