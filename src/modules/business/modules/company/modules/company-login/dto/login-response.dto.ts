import { ApiProperty } from '@nestjs/swagger';
import { GetUserDto } from '../../../../user/dto/get-user.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'User information',
    type: GetUserDto,
  })
  user: GetUserDto;

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
    description: 'URL of the dashboard to redirect',
    example: 'https://glowbeauty.beatyplug.com',
  })
  dashboardUrl: string;

  @ApiProperty({
    description: 'Subdomain of the company dashboard',
    example: 'glowbeauty',
  })
  subdomain: string;
}
