import { ApiProperty } from '@nestjs/swagger';

export class ForgetPasswordResponseDto {
  @ApiProperty({
    description:
      'Code sent successfully or not (it is always the same for security reasons)',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message (it is always the same for security reasons)',
    example:
      'Verification code has been sent if this email address exists in system',
  })
  message: string;
}
