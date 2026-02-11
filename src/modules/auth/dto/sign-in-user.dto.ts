import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsNotEmpty({ message: 'Password is required' })
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
