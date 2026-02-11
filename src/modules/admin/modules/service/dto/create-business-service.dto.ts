import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessServiceDto {
  @ApiProperty({
    description: 'Business ID',
    example: '48',
  })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  business_id: string;

  @ApiProperty({
    description: 'Specialization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  specialization_id: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Premium Haircut',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 45,
    minimum: 1,
    required: false,
    nullable: true,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Expose()
  duration_minutes?: number | null;

  @ApiProperty({
    description: 'Required number of staff members',
    example: 2,
    minimum: 1,
    required: false,
    nullable: true,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Expose()
  required_staff?: number | null;

  @ApiProperty({
    description: 'Buffer time in minutes',
    example: 10,
    minimum: 0,
    required: false,
    nullable: true,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Expose()
  buffer_minutes?: number | null;

  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
    required: false,
    default: true,
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
}

