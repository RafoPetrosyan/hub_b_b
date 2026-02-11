import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetBaseServiceDto {
  @ApiProperty({
    description: 'Service unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  specialization_id: string;

  @ApiProperty({
    description: 'Trade ID',
    example: 1,
  })
  @Expose()
  trade_id: number;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 30,
  })
  @Expose()
  duration_minutes: number;

  @ApiProperty({
    description: 'Required number of staff members',
    example: 1,
  })
  @Expose()
  required_staff: number;

  @ApiProperty({
    description: 'Buffer time in minutes',
    example: 5,
  })
  @Expose()
  buffer_minutes: number;

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
    description: 'User ID who created the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  created_by: string;

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

