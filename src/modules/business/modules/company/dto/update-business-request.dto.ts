import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCompanyBookingDto {
  @ApiProperty({
    description: 'Booking subdomain',
    example: 'glowstudio',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subdomain?: string;

  @ApiProperty({
    description: 'Custom booking subdomain',
    example: 'book.glowstudio.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  custom_subdomain?: string;
}

export class UpdateCompanyDto {
  @ApiProperty({
    description: 'Business name',
    example: 'Example LLC',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  business_name?: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    description: 'Timezone',
    example: 'America/New_York',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;

  @ApiProperty({
    description: 'Company phone number',
    example: '+123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    description: 'Company email',
    example: 'studio@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Company currency',
    example: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({
    description: 'Company logo path retrieved from file upload',
    example: 'some_name.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    description: 'Company booking settings',
    type: UpdateCompanyBookingDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCompanyBookingDto)
  booking?: UpdateCompanyBookingDto;
}

export class UpdateCompanyAddressDto {
  @ApiProperty({
    description: 'Address Line 1',
    example: 'Example st. 1',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line1?: string;

  @ApiProperty({
    description: 'Address Line 2',
    example: 'apt. 33',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiProperty({
    description: 'City',
    example: 'Vienna',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    description: 'State',
    example: 'California',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  state?: string;

  @ApiProperty({
    description: 'Postal Code',
    example: '313 4848',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @ApiProperty({
    description: 'Country (ISO 2-letter code)',
    example: 'US',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;
}

export class UpdateBusinessRequestDto {
  @ApiProperty({
    description: 'Company information',
    type: UpdateCompanyDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCompanyDto)
  company?: UpdateCompanyDto;

  @ApiProperty({
    description: 'Company address information',
    type: UpdateCompanyAddressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCompanyAddressDto)
  address?: UpdateCompanyAddressDto;
}

