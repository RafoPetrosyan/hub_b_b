import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMobileVersionDto {
  @ApiProperty({
    description: 'Mobile app version number (semantic versioning, e.g., "1.0.0")',
    example: '1.2.4',
    required: false,
  })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({
    description: 'Release date and time in ISO 8601 format',
    example: '2024-01-20T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  release_at?: string;

  @ApiProperty({
    description: 'Whether this version requires forced update',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_force?: boolean;

  @ApiProperty({
    description: 'Release notes or changelog for this version',
    example: 'Critical security updates',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
