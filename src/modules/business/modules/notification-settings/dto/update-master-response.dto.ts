import { ApiProperty } from '@nestjs/swagger';

export class UpdateMasterResponseDto {
  @ApiProperty({ description: 'Master toggle status for all notifications', example: true })
  enabled: boolean;
}

