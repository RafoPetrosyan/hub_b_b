import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUserDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @Expose()
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @Expose()
  last_name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
  })
  @Expose()
  phone: string;

  @ApiProperty({
    description: 'User status',
    example: '1',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Company ID',
    example: '1',
  })
  @Expose()
  company_id: string;

  @ApiProperty({
    description: 'Location UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  location_id?: string;

  @Exclude()
  password_hash: string;

  @Exclude()
  deleted_at: Date;
}
