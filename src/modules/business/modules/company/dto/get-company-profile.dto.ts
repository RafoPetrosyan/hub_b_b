import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CompanyBookingDto {
  @ApiProperty({
    description: 'Booking subdomain',
    example: 'glowstudio',
    required: false,
  })
  @Expose()
  subdomain?: string | null;

  @ApiProperty({
    description: 'Custom booking subdomain',
    example: 'book.glowstudio.com',
    required: false,
  })
  @Expose()
  custom_subdomain?: string | null;
}

export class CompanyDto {
  @ApiProperty({
    description: 'Business unique identifier',
    example: '45',
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Business name',
    example: 'Example LLC',
  })
  @Expose()
  business_name: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    required: false,
  })
  @Expose()
  country?: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'America/New_York',
    required: false,
  })
  @Expose()
  timezone?: string;

  @ApiProperty({
    description: 'Company email',
    example: 'studio@example.com',
    required: false,
  })
  @Expose()
  email?: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+1234567890',
    required: false,
  })
  @Expose()
  phone?: string;

  @ApiProperty({
    description: 'Company currency',
    example: 'USD',
    required: false,
  })
  @Expose()
  currency?: string;

  @ApiProperty({
    description: 'Company logo path or URL',
    example: 'image/1767086070555-2593d655-406f-4bae-9ab9-dd4b4ba6122c.png',
    required: false,
  })
  @Expose()
  logo?: string;

  @ApiProperty({
    description: 'Company booking settings',
    type: CompanyBookingDto,
    required: false,
  })
  @Expose()
  @Type(() => CompanyBookingDto)
  booking?: CompanyBookingDto;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;

  @Exclude()
  deleted_at: Date;
}

export class CompanyAddressDto {
  @ApiProperty({
    description: 'Address Line 1',
    example: 'Example st. 1',
  })
  @Expose()
  line1: string;

  @ApiProperty({
    description: 'Address Line 2',
    example: 'apt. 33',
  })
  @Expose()
  line2: string;

  @ApiProperty({
    description: 'City',
    example: 'Vienna',
  })
  @Expose()
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'California',
  })
  @Expose()
  state: string;

  @ApiProperty({
    description: 'Postal Code',
    example: '313 4848',
  })
  @Expose()
  postal_code: string;

  @ApiProperty({
    description: 'Country',
    example: 'United States',
  })
  @Expose()
  country: string;
}

export class GetBusinessDto {
  @ApiProperty({
    description: 'Company information',
    type: CompanyDto,
  })
  @Expose()
  @Type(() => CompanyDto)
  company: CompanyDto;

  @ApiProperty({
    description: 'Company address information',
    type: CompanyAddressDto,
    nullable: true,
    required: false,
  })
  @Expose()
  @Type(() => CompanyAddressDto)
  address: CompanyAddressDto | null;
}
