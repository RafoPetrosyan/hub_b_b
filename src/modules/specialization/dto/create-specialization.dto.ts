import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBaseSpecializationDto {
  @ApiProperty({
    description: 'Specialization name',
    example: 'Fine Line',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Trade ID',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Expose()
  trade_id: number;

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

