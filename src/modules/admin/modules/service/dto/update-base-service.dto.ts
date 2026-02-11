import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBaseServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  @Expose()
  name?: string;

  @ApiProperty({
    description: 'Specialization UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  @Expose()
  specialization_id?: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 30,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Expose()
  duration_minutes?: number;

  @ApiProperty({
    description: 'Required number of staff members',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Expose()
  required_staff?: number;

  @ApiProperty({
    description: 'Buffer time in minutes',
    example: 5,
    minimum: 0,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Expose()
  buffer_minutes?: number;

  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  is_active?: boolean;

  @ApiProperty({
    description: 'Whether the service is archived',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @Expose()
  archived?: boolean;
}

