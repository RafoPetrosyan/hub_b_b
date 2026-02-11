import { ApiProperty } from '@nestjs/swagger';

export class ValidationResponseDto {
  @ApiProperty({
    description: 'Indicates if the validation was successful',
    example: true,
  })
  success: boolean;
}

