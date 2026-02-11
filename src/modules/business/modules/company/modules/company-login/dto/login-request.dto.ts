import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsStrongPassword, Length, MinLength } from 'class-validator';
import { IsEmailOrPhoneNumber } from '../../../../../../../decorators/validation/is-email-or-phone-number.decorator';

export class LoginRequestDto {
  @ApiProperty({
    description: 'User email address or phone number',
    example: 'john.doe@example.com or +1234567890',
  })
  @IsNotEmpty({ message: 'Email or phone number is required' })
  @IsString()
  @IsEmailOrPhoneNumber()
  username: string;

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
    description: '2FA verification code (6 digits). Required if user has 2FA enabled.',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  code?: string;
}
