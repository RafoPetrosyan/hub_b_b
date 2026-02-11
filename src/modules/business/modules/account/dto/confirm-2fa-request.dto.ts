import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Confirm2FARequestDto {
  @ApiProperty({
    description: '6-digit verification code sent via email or SMS',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

