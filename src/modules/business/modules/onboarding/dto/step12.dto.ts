import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step12Dto {
  @ApiProperty({
    description: 'Template UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  template_id?: string;

  @ApiProperty({
    description: 'Color palette UUID',
    example: '223e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsOptional()
  color_palette_id?: string;

  @ApiProperty({
    description: 'Font UUID',
    example: '323e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  @IsOptional()
  font_id?: string;
}
