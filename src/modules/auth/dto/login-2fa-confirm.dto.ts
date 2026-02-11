import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class Login2FAConfirmDto {
  @ApiProperty({
    description: 'User UUID (provided in 2FA_REQUIRED error response)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: '6-digit verification code sent via email or SMS',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    description: '2FA verification method',
    example: 'email',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['email', 'phone'])
  method?: string;
}

