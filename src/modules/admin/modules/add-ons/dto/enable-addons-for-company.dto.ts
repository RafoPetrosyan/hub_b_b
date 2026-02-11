import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnableAddonsForCompanyDto {
  @ApiProperty({
    description: 'Array of add-on UUIDs to enable or disable for the company',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  addonIds: string[];
}
