import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GetAddressDto } from './get-address.dto';
import { GetWorkingHourDto } from './get-working-hour.dto';
import { GetTradeDto } from '../../../../admin/modules/trade/dto/get-trade.dto';

export class GetLocationDto {
  @ApiProperty({
    description: 'Location id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Location name',
    example: 'Downtown Branch',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Whether this is the primary location for the company',
    example: true,
  })
  @Expose()
  is_primary: boolean;

  @ApiProperty({
    description: 'Location address',
    type: GetAddressDto,
  })
  @Expose()
  @Type(() => GetAddressDto)
  address: GetAddressDto;

  @ApiProperty({
    description: 'Working hours for the location',
    type: [GetWorkingHourDto],
  })
  @Expose()
  @Type(() => GetWorkingHourDto)
  working_hours: GetWorkingHourDto[];

  @ApiProperty({
    description: 'Trades associated with this location',
    type: [GetTradeDto],
  })
  @Expose()
  @Type(() => GetTradeDto)
  trades: GetTradeDto[];

  @Exclude()
  status: any;

  @Exclude()
  company_id: string;

  @Exclude()
  created_at: Date;

  @Exclude()
  updated_at: Date;

  @Exclude()
  deletedAt: Date;

  @Exclude()
  users: any;

  @Exclude()
  workingHours: any;

  @Exclude()
  company: any;
}

