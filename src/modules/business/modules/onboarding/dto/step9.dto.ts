import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class Step9ServiceItemDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Deep Cleansing Facial',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Specialization name',
    example: 'Facial Treatments',
  })
  @IsString()
  @IsNotEmpty()
  specialization_name: string;

  @ApiProperty({
    description: 'Service price in cents',
    example: 12500,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  price_in_cents: number;
}

export class Step9Dto {
  @ApiProperty({
    description: 'Services with specialization and price',
    type: [Step9ServiceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Step9ServiceItemDto)
  services: Step9ServiceItemDto[];
}
