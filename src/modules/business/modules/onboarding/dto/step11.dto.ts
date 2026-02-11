import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum BusinessLocationType {
  MOBILE = 'mobile',
  VIRTUAL = 'virtual',
  STUDIO = 'studio',
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  PROVIDER = 'provider',
}

export class TeamMemberDto {
  @ApiProperty({
    description: 'Team member name',
    example: 'Jane Doe',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Team member Email address',
    example: 'jane@doe.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Team member role',
    example: UserRole.PROVIDER,
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class Step11Dto {
  @ApiProperty({
    description: 'Business location type',
    example: BusinessLocationType.STUDIO,
    enum: BusinessLocationType,
  })
  @IsEnum(BusinessLocationType)
  type: BusinessLocationType;

  @ApiProperty({
    description: 'Physical address of the studio (when type is studio)',
    example: '123 Main St, City, State 12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  studio_address?: string;

  @ApiProperty({
    description: 'Array of team members',
    type: [TeamMemberDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  team?: TeamMemberDto[];
}
