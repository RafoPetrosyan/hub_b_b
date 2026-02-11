import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'The status of password changing for current user',
    example: 'true',
  })
  @IsBoolean()
  success: boolean;
}
