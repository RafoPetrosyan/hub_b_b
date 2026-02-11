import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationCodeResponse {
  @ApiProperty({
    description: 'Status of verification code sending process',
    example: 'false',
  })
  success: boolean;
}

