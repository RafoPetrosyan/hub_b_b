import { ApiProperty } from '@nestjs/swagger';
import { GetUserDto } from '../../../../user/dto/get-user.dto';

export class RegisterResponseDto {
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
}

