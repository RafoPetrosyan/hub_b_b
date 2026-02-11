import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetAccountDto {
  @ApiProperty({
    description: 'Account first name',
    example: 'John',
  })
  @Expose()
  first_name: string;

  @ApiProperty({
    description: 'Account last name',
    example: 'Doe',
  })
  @Expose()
  last_name: string;

  @ApiProperty({
    description: 'Account email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Account phone number',
    example: '+1234567890',
  })
  @Expose()
  phone: string;

  @ApiProperty({
    description: 'Account logo URL',
    example: 'https://example.com/uploads/users/123/image.png',
    required: false,
  })
  @Expose()
  logo?: string;

  @Exclude()
  password_hash: string;

  @Exclude()
  created_at: string;

  @Exclude()
  updated_at: string;

  @Exclude()
  deleted_at: string;
}
