import { PartialType } from '@nestjs/swagger';
import { CreateBaseSpecializationDto } from './create-specialization.dto';

export class UpdateBaseSpecializationDto extends PartialType(
  CreateBaseSpecializationDto,
) {
}

