import { ApiProperty } from '@nestjs/swagger';
import { GetBusinessDto } from '../../../dto/get-business.dto';

export class RegisterBusinessResponseDto {
  @ApiProperty({
    description: 'Business information',
    type: GetBusinessDto,
  })
  business: GetBusinessDto;

  @ApiProperty({
    description: 'Verification code (6 digits) - expires in 10 minutes',
    example: '123456',
  })
  verificationCode: string;
}

