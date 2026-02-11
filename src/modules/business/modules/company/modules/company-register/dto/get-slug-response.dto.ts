import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetSlugResponseDto {
  @ApiProperty({
    description: 'Business slug',
    example: 'myawesomebusiness-1',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  available: string;
}
