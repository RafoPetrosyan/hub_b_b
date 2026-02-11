import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMobileVersionDto {
  @ApiProperty({
    description: 'Mobile app version number (semantic versioning, e.g., "1.0.0")',
    example: '1.2.3',
  })
  @IsString()
  version: string;

  @ApiProperty({
    description: 'Release date and time in ISO 8601 format',
    example: '2024-01-15T10:00:00Z',
  })
  @IsDateString()
  release_at: string;

  @ApiProperty({
    description: 'Whether this version requires forced update',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_force?: boolean;

  @ApiProperty({
    description: 'Release notes or changelog for this version',
    example: 'Bug fixes and performance improvements',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
