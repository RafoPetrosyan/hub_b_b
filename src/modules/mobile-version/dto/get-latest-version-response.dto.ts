import { ApiProperty } from '@nestjs/swagger';

export class LatestVersionDto {
  @ApiProperty({ description: 'Mobile version ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Version number (semantic versioning)', example: '1.2.3' })
  version: string;

  @ApiProperty({ description: 'Release date and time', example: '2024-01-15T10:00:00Z' })
  release_at: Date;

  @ApiProperty({
    description: 'Whether this version requires forced update. Will be true if any newer version (between current and latest) has is_force=true',
    example: false,
  })
  is_force: boolean;

  @ApiProperty({
    description: 'Release notes or changelog',
    example: 'Bug fixes and performance improvements',
    nullable: true,
  })
  notes: string | null;
}

export class NewerVersionDto {
  @ApiProperty({ description: 'Mobile version ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Version number (semantic versioning)', example: '1.2.1' })
  version: string;

  @ApiProperty({ description: 'Release date and time', example: '2024-01-10T10:00:00Z' })
  release_at: Date;

  @ApiProperty({ description: 'Whether this version requires forced update', example: false })
  is_force: boolean;

  @ApiProperty({ description: 'Release notes or changelog', example: 'Security updates', nullable: true })
  notes: string | null;
}

export class GetLatestVersionResponseDto {
  @ApiProperty({
    description: 'Latest mobile version information (most recent by release date). If any version between current_version and latest has is_force=true, latest.is_force will be true.',
    type: LatestVersionDto,
    nullable: true,
  })
  latest: LatestVersionDto | null;

  @ApiProperty({
    description: 'List of versions newer than the current_version (if provided). Sorted by release date ascending. If current_version is not provided, returns all versions.',
    type: [NewerVersionDto],
    example: [],
  })
  newer: NewerVersionDto[];
}

