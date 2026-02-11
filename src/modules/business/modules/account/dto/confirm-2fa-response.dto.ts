import { ApiProperty } from '@nestjs/swagger';

export class Confirm2FAResponseDto {
  @ApiProperty({
    description: '2FA token to be used in X-2FA-Token header for protected endpoints',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  twoFaToken: string;
}

