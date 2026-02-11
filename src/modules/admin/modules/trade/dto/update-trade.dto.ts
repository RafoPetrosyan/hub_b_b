import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTradeDto {
  @ApiProperty({
    description: 'Trade name',
    example: 'Hair Styling',
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
    description: 'Whether the trade is active',
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
    description: 'Unique type identifier for the trade group',
    example: '123456-1234-1234-123456'
  })
  @IsString()
  @IsUUID()
  @Expose()
  @IsOptional()
  group_id?: string
}
