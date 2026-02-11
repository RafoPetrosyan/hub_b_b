import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetStaffDto {
  @ApiProperty({
    description: 'Staff unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Staff first name',
    example: 'John',
  })
  @Expose()
  first_name: string;

  @ApiProperty({
    description: 'Staff last name',
    example: 'Doe',
  })
  @Expose()
  last_name: string;

  @ApiProperty({
    description: 'Staff email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Staff phone number',
    example: '+1234567890',
    required: false,
  })
  @Expose()
  phone?: string;

  @ApiProperty({
    description: 'Staff location name',
    example: 'New York Branch',
    required: false,
  })
  @Expose()
  location_name?: string;

  @ApiProperty({
    description: 'Staff role',
    example: 'manager',
  })
  @Expose()
  role: string;

  @ApiProperty({
    description: 'Company ID',
    example: 1,
  })
  @Expose()
  company_id: string;

  @ApiProperty({
    description: 'Location ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Expose()
  location_id?: string;

  @ApiProperty({
    description: 'User status',
    example: 'inactive',
  })
  @Expose()
  status: string;

  @Exclude()
  password_hash: string;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;

  @Exclude()
  deleted_at: Date;
}

