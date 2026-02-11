import { PartialType } from '@nestjs/swagger';
import { CreateBusinessSpecializationDto } from './create-business-specialization.dto';

export class UpdateBusinessSpecializationDto extends PartialType(
  CreateBusinessSpecializationDto,
) {
}


