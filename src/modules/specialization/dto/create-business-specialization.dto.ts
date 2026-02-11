import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessSpecializationDto {
  @ApiProperty({
    description: 'Business ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Expose()
  business_id: string;

  @ApiProperty({
    description: 'Specialization name',
    example: 'Custom Fine Line',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Whether the specialization is active',
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


