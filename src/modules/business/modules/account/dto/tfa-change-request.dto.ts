import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class TfaChangeRequestDto {
  @ApiProperty({
    description: 'Two-factor authentication mode',
    example: true,
    examples: {
      inactive: {
        value: false,
        description: 'Disable 2FA',
      },
      email: {
        value: true,
        description: 'Enable 2FA',
      },
    },
  })
  @IsNotEmpty()
  @IsBoolean()
  mode: boolean;
}
