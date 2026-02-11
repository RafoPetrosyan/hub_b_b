import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'URL of the uploaded file',
    example: 'https://example.com/uploads/image/1234567890-abc123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Filename of the uploaded file',
    example: '1234567890-abc123.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'File format type',
    enum: ['image', 'video', 'pdf'],
    example: 'image',
  })
  file_format: string;

  @ApiProperty({
    description: 'File size in KB',
    example: 1024,
  })
  file_size_kb: number;

  @ApiProperty({
    description: 'File metadata (width, height, format for images)',
    example: { width: 1920, height: 1080, format: 'jpeg', mime: 'image/jpeg' },
    required: false,
  })
  metadata?: any;

  @ApiProperty({
    description: 'Media ID in database',
    example: 1,
  })
  mediaId: number;
}

