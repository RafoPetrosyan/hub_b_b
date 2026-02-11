import { ApiProperty } from '@nestjs/swagger';

export class Resend2FAResponseDto {
  @ApiProperty({
    description: 'Indicates if the 2FA code was successfully resent',
    example: true,
  })
  success: boolean;
}

