import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AddressDto } from './address.dto';
import { WorkingHourDto } from './working-hour.dto';

export class CreateLocationDto {
  @ApiProperty({
    description: 'Location name',
    example: 'Downtown Branch',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Location address',
    type: AddressDto,
  })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'Working hours for the location',
    type: [WorkingHourDto],
    example: [
      {
        day: 'Monday',
        open: '09:00',
        close: '17:00',
        breaks: [{ start: '12:00', end: '13:00' }],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  working_hours: WorkingHourDto[];

  @ApiProperty({
    description: 'Connected Trade IDs (must belong to the company)',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  trades?: number[];

  @ApiProperty({
    description: 'Whether this location should be set as primary. Only one location can be primary per company.',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}
