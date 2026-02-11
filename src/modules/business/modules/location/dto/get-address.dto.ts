import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetAddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  @Expose()
  street: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
  })
  @Expose()
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
  })
  @Expose()
  state: string;

  @ApiProperty({
    description: 'ZIP or postal code',
    example: '10001',
  })
  @Expose()
  zip: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
  })
  @Expose()
  country: string;

  @ApiProperty({
    description: 'IANA timezone identifier',
    example: 'America/New_York',
  })
  @Expose()
  timezone: string;

  @Exclude()
  id: string;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;

  @Exclude()
  deletedAt: Date;
}

