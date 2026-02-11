import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class Resend2FARequestDto {
  @ApiProperty({
    description: '2FA verification method',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['email', 'phone'])
  method: 'email' | 'phone';
}

