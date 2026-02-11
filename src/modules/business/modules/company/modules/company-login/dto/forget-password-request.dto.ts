import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsEmailOrPhoneNumber } from '../../../../../../../decorators/validation/is-email-or-phone-number.decorator';

export class ForgetPasswordRequestDto {
  @ApiProperty({
    description: 'User email address or phone number',
    example: 'john.doe@example.com or +1234567890',
  })
  @IsNotEmpty({ message: 'Email or phone number is required' })
  @IsString()
  @IsEmailOrPhoneNumber()
  username: string;
}
