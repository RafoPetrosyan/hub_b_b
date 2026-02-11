import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsStrongPassword, MaxLength, MinLength } from 'class-validator';
import { Match } from '../../../../../../../decorators/validation/match.decorators';

export class RegisterRequestDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  first_name: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  last_name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'User password (must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 symbol)',
    example: 'password123',
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
    description: 'User\'s new password\'s confirmation (minimum 8 characters)',
    example: 'Password123!',
    minLength: 8,
  })
  @Match('password', { message: 'Passwords do not match' })
  password_confirmation: string;
}
