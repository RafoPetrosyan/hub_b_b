import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyForgetPasswordResponseDto {
  @ApiProperty({
    description: 'JWT password reset token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  resetToken: string;
}
