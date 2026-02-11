import { ApiProperty } from '@nestjs/swagger';

export class MobileVersionResponseDto {
  @ApiProperty({ description: 'Mobile version ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Version number', example: '1.2.3' })
  version: string;

  @ApiProperty({ description: 'Release date and time', example: '2024-01-15T10:00:00Z' })
  release_at: Date;

  @ApiProperty({ description: 'Whether this version requires forced update', example: false })
  is_force: boolean;

  @ApiProperty({ description: 'Release notes', example: 'Bug fixes and performance improvements', nullable: true })
  notes: string | null;
}

