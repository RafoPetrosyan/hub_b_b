import { IsString, Length } from 'class-validator';

export class CreateTradeGroupDto {
  @IsString()
  @Length(1, 200)
  name: string;
}
