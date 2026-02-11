import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyCodeRequestDto {
  @ApiProperty({
    description: 'User UUID',
    example: '123456-1234-1234-123456',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({
    description: 'Verification code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

