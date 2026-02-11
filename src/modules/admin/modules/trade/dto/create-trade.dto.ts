import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../../business/modules/notification-template/enum/notification-type.enum';

export class CreateTradeDto {
  @ApiProperty({
    description: 'Trade name',
    example: 'Hair Styling',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Whether the trade is active',
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

  @ApiProperty({
    description: 'Unique type identifier for the trade group',
    example: '123456-1234-1234-123456'
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  group_id: string
}
