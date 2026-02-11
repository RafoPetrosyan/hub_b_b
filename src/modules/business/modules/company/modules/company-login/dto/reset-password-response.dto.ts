import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: 'true',
  })
  @IsBoolean()
  success: boolean;
  @ApiProperty({
    description: 'Message of the process',
    example: 'Password reset success',
  })
  @IsString()
  message: string;
}
