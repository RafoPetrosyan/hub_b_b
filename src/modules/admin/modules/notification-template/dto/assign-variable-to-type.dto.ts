import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../../business/modules/notification-template/enum/notification-type.enum';

export class AssignVariableToTypeDto {
  @ApiProperty({
    description: 'Notification variable unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  variableId: string;

  @ApiProperty({
    description: 'Notification type key',
    enum: NotificationType,
    example: NotificationType.USER_WELCOME,
  })
  @IsEnum(NotificationType)
  type: NotificationType;
}
