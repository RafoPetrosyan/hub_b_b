import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationVariableDto {
  @ApiProperty({
    description: 'Variable key used in template (e.g., user.name, user.email)',
    example: 'user.name',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  key: string;

  @ApiProperty({
    description: 'Human-readable label for the variable',
    example: 'User Full Name',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @ApiProperty({
    description: 'Description of what this variable represents',
    example: 'The full name of the user receiving the notification',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether this variable is required in the template',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  required: boolean;
}
