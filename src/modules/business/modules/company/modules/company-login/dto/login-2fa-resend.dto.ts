import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class Login2FAResendDto {
  @ApiProperty({
    description: 'User UUID (provided in 2FA_REQUIRED error response)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  user_id: string;

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

