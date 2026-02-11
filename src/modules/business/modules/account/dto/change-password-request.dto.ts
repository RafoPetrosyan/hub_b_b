import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsStrongPassword, MinLength } from 'class-validator';
import { Match } from '../../../../../decorators/validation/match.decorators';

export class ChangePasswordRequestDto {
  @ApiProperty({
    description: 'User\'s old password (minimum 8 characters)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Current password is required' })
  @MinLength(8, { message: 'Current password must be at least 8 characters long' })
  old_password: string;

  @ApiProperty({
    description: 'User\'s new password (minimum 8 characters)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'New password is required' })
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
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'User\'s new password\'s confirmation (minimum 8 characters)',
    example: 'Password123!',
    minLength: 8,
  })
  @Match('password', { message: 'Passwords do not match' })
  password_confirmation: string;
}
