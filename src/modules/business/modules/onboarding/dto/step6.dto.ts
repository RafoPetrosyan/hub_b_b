import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step6Dto {
  @ApiProperty({
    description: 'Verification code sent to user (6 digits)',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'verification_code must be 6 digits' })
  verification_code: string;
}
