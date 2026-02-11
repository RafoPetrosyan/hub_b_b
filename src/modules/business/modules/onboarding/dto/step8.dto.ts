import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step8Dto {
  @ApiProperty({
    description: 'Business/company name',
    example: 'Aesthetic Hub',
  })
  @IsString()
  @IsNotEmpty()
  business_name: string;

  @ApiProperty({
    description: 'Logo URL',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({
    description: 'Business phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State/Province',
    example: 'NY',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Country',
    example: 'US',
  })
  @IsString()
  @MaxLength(2)
  country: string;

  @ApiProperty({
    description: 'Timezone (IANA timezone identifier)',
    example: 'America/New_York',
  })
  @IsString()
  timezone: string;

  @ApiProperty({
    description: 'Business address',
    example: '123 Main St, New York, NY 10001',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
