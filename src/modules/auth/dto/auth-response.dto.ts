import { ApiProperty } from '@nestjs/swagger';
import { GetUserDto } from '../../business/modules/user/dto/get-user.dto';

export class AuthResponseDto {
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
}

