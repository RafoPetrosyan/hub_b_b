import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { User } from '../user/entities/user.entity';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationAddress } from './entities/location-address.entity';
import { UserRole } from '../../../auth';
import Helpers from '../../../../utils/helpers';
import { LocationWorkingHours } from './entities/location-working-hours.entity';
import { GetLocationDto } from './dto/get-location.dto';
import { Company } from '../company/entities/company.entity';
import { Trade } from '../../../common/modules/trade/entities/trade.entity';

@Injectable()
export class LocationService {

  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(LocationAddress)
    private readonly locationAddressRepository: Repository<LocationAddress>,
    @InjectRepository(LocationWorkingHours)
    private readonly locationWorkingHoursRepository: Repository<LocationWorkingHours>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {
  }

  async findAll(userId: string) {
    const user = await this.getUser(userId);
    let locations: Location[];

    if (user.role === 'Provider') {
      locations = [];
    } else if (user.role === 'Manager') {
      locations = await this.locationRepository.find({
        where: { id: user.location_id, company_id: user.company_id },
        relations: ['address', 'workingHours', 'trades'],
      });
    } else {
      locations = await this.locationRepository.find({
        where: { company_id: user.company_id },
        relations: ['address', 'workingHours', 'trades'],
      });
    }

    return locations.map(location => this.transformLocationResponse(location));
  }

  async findOne(id: string, userId: string) {
    const location = await this.locationRepository.findOne(
      {
        where: { id },
        relations: ['address', 'workingHours', 'trades'],
      },
    );
    if (!location) throw new NotFoundException();

    await this.checkReadAccess(location, userId);
    return this.transformLocationResponse(location);
  }

  async create(dto: CreateLocationDto, userId: string) {
    return this.dataSource.transaction(async (tx) => {
      const user = await this.getUser(userId);
      const locationRepository = tx.getRepository(Location);
      const locationAddressRepository = tx.getRepository(LocationAddress);
      const locationWorkingHoursRepository = tx.getRepository(LocationWorkingHours);
      const tradesRepository = tx.getRepository(Trade);

      if (dto.is_primary) {
        await locationRepository.update({
          company_id: user.company_id,
          is_primary: true,
        }, {
          is_primary: false,
        });
      }

      Helpers.validateWorkingHours(dto.working_hours);

      const location = locationRepository.create({
        name: dto.name,
        is_primary: dto.is_primary ?? false,
        company_id: user.company_id,
      });
      const savedLocation = await locationRepository.save(location);

      const address = locationAddressRepository.create({
        street: dto.address.street,
        city: dto.address.city,
        state: dto.address.state,
        zip: dto.address.zip,
        country: dto.address.country,
        timezone: dto.address.timezone,
        location: savedLocation,
      });
      await locationAddressRepository.save(address);

      await Promise.all(
        dto.working_hours.map(async (h) => {
          const workingHour = locationWorkingHoursRepository.create({
            location: savedLocation,
            day: h.day,
            open: h.open,
            close: h.close,
            breaks: h.breaks ?? [],
          });
          return await locationWorkingHoursRepository.save(workingHour);
        }),
      );

      if (dto.trades && dto.trades.length > 0) {
        const companyRepository = tx.getRepository(Company);
        const company = await companyRepository.findOne({
          where: { id: user.company_id },
          relations: ['trades'],
        });

        if (!company) {
          throw new NotFoundException('Company not found');
        }

        const companyTradeIds = company.trades?.map(t => t.id) || [];

        const validTradeIds = dto.trades.filter(tradeId => companyTradeIds.includes(tradeId));

        if (validTradeIds.length > 0) {
          const locationRepo = tx.getRepository(Location);
          const locationWithTrades = await locationRepo.findOne({
            where: { id: savedLocation.id },
            relations: ['trades'],
          });

          if (locationWithTrades) {
            locationWithTrades.trades = await tradesRepository.find({
              where: { id: In(validTradeIds) },
            });
            await locationRepo.save(locationWithTrades);
          }
        }
      }

      const locationWithRelations = await locationRepository.findOne({
        where: { id: savedLocation.id },
        relations: ['address', 'workingHours', 'trades'],
      });

      return this.transformLocationResponse(locationWithRelations);
    });
  }

  async update(id: string, dto: UpdateLocationDto, userId: string) {
    return this.dataSource.transaction(async (tx) => {
      const locationRepository = tx.getRepository(Location);
      const locationAddressRepository = tx.getRepository(LocationAddress);
      const locationWorkingHoursRepository = tx.getRepository(LocationWorkingHours);
      const tradesRepository = tx.getRepository(Trade);

      const location = await locationRepository.findOne({
        where: { id },
        relations: ['address', 'workingHours', 'trades'],
      });
      if (!location) throw new NotFoundException();

      await this.checkWriteAccess(location, userId);

      if (dto.name !== undefined) {
        location.name = dto.name;
      }

      if (dto.is_primary !== undefined && dto.is_primary !== location.is_primary) {
        await locationRepository.update({
          company_id: location.company_id,
          is_primary: true,
        }, {
          is_primary: false,
        });
        location.is_primary = dto.is_primary;
      }

      if (dto.address) {
        if (location.address) {
          Object.assign(location.address, dto.address);
          await locationAddressRepository.save(location.address);
        } else {
          const address = locationAddressRepository.create({
            ...dto.address,
            location: location,
          });
          location.address = await locationAddressRepository.save(address);
        }
      }

      if (dto.working_hours) {
        Helpers.validateWorkingHours(dto.working_hours);

        await locationWorkingHoursRepository.delete({
          location_id: id,
        });

        location.workingHours = await Promise.all(
          dto.working_hours.map(async (h) => {
            const workingHour = locationWorkingHoursRepository.create({
              location: location,
              day: h.day,
              open: h.open,
              close: h.close,
              breaks: h.breaks ?? [],
            });
            return locationWorkingHoursRepository.save(workingHour);
          }),
        );
      }

      if (dto.trades && dto.trades.length > 0) {
        const companyRepository = tx.getRepository(Company);
        const company = await companyRepository.findOne({
          where: { id: location.company_id },
          relations: ['trades'],
        });

        if (!company) {
          throw new NotFoundException('Company not found');
        }

        const companyTradeIds = company.trades?.map(t => t.id) || [];

        const validTradeIds = dto.trades.filter(tradeId => companyTradeIds.includes(tradeId));

        if (validTradeIds.length > 0) {
          const locationRepo = tx.getRepository(Location);
          const locationWithTrades = await locationRepo.findOne({
            where: { id: location.id },
            relations: ['trades'],
          });

          if (locationWithTrades) {
            locationWithTrades.trades = await tradesRepository.find({
              where: { id: In(validTradeIds) },
            });
            await locationRepo.save(locationWithTrades);
          }
        }
      }

      await locationRepository.save(location);

      // Reload with relations
      const updatedLocation = await locationRepository.findOne({
        where: { id },
        relations: ['address', 'workingHours', 'trades'],
      });

      return this.transformLocationResponse(updatedLocation);
    });
  }

  async remove(id: string, userId: string) {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) throw new NotFoundException();

    if (location.is_primary) {
      throw new BadRequestException('Primary location cannot be deleted');
    }

    await this.checkWriteAccess(location, userId);

    await this.locationRepository.remove(location);
    return { status: 'deleted' };
  }

  private async checkReadAccess(location: Location, userId: string) {
    const user = await this.getUser(userId);
    if (
      (user.role === UserRole.MANAGER || user.role === UserRole.PROVIDER) &&
      user.location_id !== location.id
    ) {
      throw new ForbiddenException();
    }
  }

  private async checkWriteAccess(location: Location, userId: string) {
    const user = await this.getUser(userId);
    if (user.role === UserRole.SUPER_ADMIN) return;
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.BUSINESS_ADMIN) return;

    if (
      user.role === UserRole.MANAGER &&
      user.location_id !== location.id
    ) {
      return;
    }

    throw new ForbiddenException();
  }

  private async getUser(userId: string) {
    return await this.userRepository.findOneBy({ id: userId });
  }

  private transformLocationResponse(location: Location): GetLocationDto {
    if (!location) {
      return null;
    }

    // Map workingHours to working_hours and ensure breaks are properly formatted
    const responseData = {
      id: location.id,
      name: location.name,
      is_primary: location.is_primary,
      address: location.address,
      working_hours: location.workingHours?.map(wh => ({
        day: wh.day,
        open: wh.open,
        close: wh.close,
        breaks: Array.isArray(wh.breaks) ? wh.breaks : [],
      })) || [],
      trades: location.trades || [],
    };

    return plainToClass(GetLocationDto, responseData, {
      excludeExtraneousValues: true,
    });
  }
}
