import { ApiProperty } from '@nestjs/swagger';

export class UnifiedRegisterResponseDto {
  @ApiProperty({
    description: 'User UUID',
    example: '123456-1234-1234-123456',
  })
  user_id: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Registration successful. Verification code sent.',
  })
  message: string;

  @ApiProperty({
    description: 'Access Token',
    example: '',
  })
  access_token: string;

  @ApiProperty({
    description: 'Refresh Token',
    example: '',
  })
  refresh_token: string;
}

