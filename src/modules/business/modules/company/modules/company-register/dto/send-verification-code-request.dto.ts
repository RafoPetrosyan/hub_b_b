import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendVerificationCodeRequest {
  @ApiProperty({
    description: 'Verification code send method "email" or "phone"',
    example: 'email',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['email', 'phone'])
  method: 'email' | 'phone';

  @ApiProperty({
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  user_id: string;
}

