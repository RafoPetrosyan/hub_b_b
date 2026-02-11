import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsIanaTimezone } from '../../../../../decorators/validation/is-iana-timezone.decorator';

export class AddressDto {
  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  @IsString() @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
  })
  @IsString() @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
  })
  @IsString() @IsNotEmpty()
  state: string;

  @ApiProperty({
    description: 'ZIP or postal code',
    example: '10001',
  })
  @IsString() @IsNotEmpty()
  zip: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
  })
  @IsString() @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'IANA timezone identifier',
    example: 'America/New_York',
  })
  @IsString()
  @IsNotEmpty()
  @IsIanaTimezone()
  timezone: string;
}
