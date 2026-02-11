import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User verified and activated.',
  })
  message: string;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Dashboard URL',
    example: 'https://glowbeauty.beautyhub.com/dashboard',
  })
  dashboard_url: string;
}

