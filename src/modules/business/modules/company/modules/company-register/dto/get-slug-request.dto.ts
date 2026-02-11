import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSlugRequestDto {
  @ApiProperty({
    description: 'Business name',
    example: 'My Awesome Business',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  name: string;
}
