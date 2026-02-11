import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';
import { Match } from '../../../../../../../decorators/validation/match.decorators';

export class ResetPasswordRequestDto {
  @ApiProperty({
    description: 'JWT password reset token received from verify endpoint',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  resetToken: string;

  @ApiProperty({
    description:
      'User password (must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    {
      message: 'Password is too weak',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Match('password')
  password_confirmation: string;
}
