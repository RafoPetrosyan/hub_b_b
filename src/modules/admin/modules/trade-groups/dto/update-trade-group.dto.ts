import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateTradeGroupDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;
}
