import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { AreTradeUUIDsExist } from '../../../../../../../decorators/validation/are-trade-uuids-exists.decorator';

export class RegisterBusinessRequestDto {
  @ApiProperty({
    description: 'Business name',
    example: 'My Awesome Business',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Region/State name',
    example: 'California',
    required: false,
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({
    description: 'Array of the Trade IDs',
    example:
      '["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001", "123e4567-e89b-12d3-a456-426614174002"]',
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @AreTradeUUIDsExist({ message: 'One or more trade IDs do not exist.' })
  tradeIds: string[];
}
