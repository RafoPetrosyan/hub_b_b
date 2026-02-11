import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetBusinessDto {
  @ApiProperty({
    description: 'Business unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Business name',
    example: 'Example LLC',
  })
  @Expose({ name: 'business_name' })
  name: string;

  @ApiProperty({
    description: 'Business slug (URL-friendly identifier)',
    example: 'my-awesome-business',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Business status',
    example: 'inactive',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    required: false,
  })
  @Expose()
  country?: string;

  @ApiProperty({
    description: 'Region/State name',
    example: 'California',
    required: false,
  })
  @Expose()
  region?: string;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;
}
