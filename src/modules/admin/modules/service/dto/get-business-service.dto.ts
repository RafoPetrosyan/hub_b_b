import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetBusinessServiceDto {
  @ApiProperty({
    description: 'Service unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Business ID',
    example: '48',
  })
  @Expose()
  business_id: string;

  @ApiProperty({
    description: 'Specialization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  specialization_id: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Premium Haircut',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 45,
    nullable: true,
  })
  @Expose()
  duration_minutes: number | null;

  @ApiProperty({
    description: 'Required number of staff members',
    example: 2,
    nullable: true,
  })
  @Expose()
  required_staff: number | null;

  @ApiProperty({
    description: 'Buffer time in minutes',
    example: 10,
    nullable: true,
  })
  @Expose()
  buffer_minutes: number | null;

  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Whether the service is archived',
    example: false,
  })
  @Expose()
  archived: boolean;

  @ApiProperty({
    description: 'Service creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'Service last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updated_at: Date;
}

