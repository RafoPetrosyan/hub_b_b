import { ApiProperty } from '@nestjs/swagger';

export class TfaChangeResponseDto {
  @ApiProperty({
    description: 'Indicates if the 2FA mode was successfully changed',
    example: true,
  })
  success: boolean;
}

