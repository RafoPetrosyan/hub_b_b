import { IsUUID } from 'class-validator';

export class RemoveAddonFromPlanDto {
  @IsUUID()
  addon_id: string;
}
