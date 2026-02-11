import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../auth';

export class GetCurrentAdminDto {
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
    description: 'User role',
    example: UserRole.BUSINESS_ADMIN,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    description: 'User 2fa mode',
    example: true,
  })
  @Expose()
  tfa_mode: boolean;

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
