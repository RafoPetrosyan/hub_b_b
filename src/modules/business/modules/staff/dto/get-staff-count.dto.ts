import { ApiProperty } from '@nestjs/swagger';

export class GetStaffCountDto {
  @ApiProperty({
    description: 'Total count of all staff members',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Count of staff members with BUSINESS_ADMIN role',
    example: 2,
  })
  business_admin: number;

  @ApiProperty({
    description: 'Count of staff members with MANAGER role',
    example: 5,
  })
  manager: number;

  @ApiProperty({
    description: 'Count of staff members with PROVIDER role',
    example: 18,
  })
  provider: number;
}

