import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from './entities/base-service.entity';
import { BusinessService } from './entities/business-service.entity';
import { BaseSpecialization } from '../../../specialization/entities/specialization.entity';
import { CreateBaseServiceDto } from './dto/create-base-service.dto';
import { UpdateBaseServiceDto } from './dto/update-base-service.dto';
import { GetBaseServiceDto } from './dto/get-base-service.dto';
import { CreateBusinessServiceDto } from './dto/create-business-service.dto';
import { UpdateBusinessServiceDto } from './dto/update-business-service.dto';
import { GetBusinessServiceDto } from './dto/get-business-service.dto';
import { Trade } from '../../../common/modules/trade/entities/trade.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(BaseService)
    private readonly baseServiceRepository: Repository<BaseService>,
    @InjectRepository(BusinessService)
    private readonly businessServiceRepository: Repository<BusinessService>,
    @InjectRepository(BaseSpecialization)
    private readonly specializationRepository: Repository<BaseSpecialization>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {
  }

  // Base Service CRUD
  async findAllBaseServices(specializationId?: string): Promise<GetBaseServiceDto[]> {
    return await this.baseServiceRepository.find({
      ...(specializationId && { where: { specialization_id: specializationId } }),
      order: { created_at: 'DESC' },
    });
  }

  async findOneBaseService(id: string): Promise<GetBaseServiceDto> {
    const service = await this.baseServiceRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Base service not found');
    }
    return service;
  }

  async createBaseService(
    createBaseServiceDto: CreateBaseServiceDto,
    userId: string,
  ): Promise<GetBaseServiceDto> {
    // Verify that the specialization exists and get its trade_id
    const specialization = await this.specializationRepository.findOne({
      where: { id: createBaseServiceDto.specialization_id },
    });
    if (!specialization) {
      throw new NotFoundException('Specialization not found');
    }

    const service = this.baseServiceRepository.create({
      ...createBaseServiceDto,
      trade_id: specialization.trade_id, // Automatically set from specialization
      required_staff: createBaseServiceDto.required_staff ?? 1,
      buffer_minutes: createBaseServiceDto.buffer_minutes ?? 0,
      is_active: createBaseServiceDto.is_active ?? true,
      created_by: userId,
    });
    return await this.baseServiceRepository.save(service);
  }

  async updateBaseService(
    id: string,
    updateBaseServiceDto: UpdateBaseServiceDto,
  ): Promise<GetBaseServiceDto> {
    const service = await this.baseServiceRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Base service not found');
    }

    // If specialization_id is being updated, verify the new specialization exists and update trade_id
    if (updateBaseServiceDto.specialization_id) {
      const specialization = await this.specializationRepository.findOne({
        where: { id: updateBaseServiceDto.specialization_id },
      });
      if (!specialization) {
        throw new NotFoundException('Specialization not found');
      }
      // Automatically update trade_id from the new specialization
      service.trade_id = specialization.trade_id;
    }

    Object.assign(service, updateBaseServiceDto);
    return await this.baseServiceRepository.save(service);
  }

  async removeBaseService(id: string): Promise<void> {
    const service = await this.baseServiceRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Base service not found');
    }
    await this.baseServiceRepository.remove(service);
  }

  // Business Service CRUD
  async findAllBusinessServices(): Promise<GetBusinessServiceDto[]> {
    return await this.businessServiceRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOneBusinessService(id: string): Promise<GetBusinessServiceDto> {
    const service = await this.businessServiceRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Business service not found');
    }
    return service;
  }

  async createBusinessService(
    createBusinessServiceDto: CreateBusinessServiceDto,
  ): Promise<GetBusinessServiceDto> {
    const service = this.businessServiceRepository.create({
      ...createBusinessServiceDto,
      is_active: createBusinessServiceDto.is_active ?? true,
    });
    return await this.businessServiceRepository.save(service);
  }

  async updateBusinessService(
    id: string,
    updateBusinessServiceDto: UpdateBusinessServiceDto,
  ): Promise<GetBusinessServiceDto> {
    const service = await this.businessServiceRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Business service not found');
    }
    Object.assign(service, updateBusinessServiceDto);
    return await this.businessServiceRepository.save(service);
  }

  async removeBusinessService(id: string): Promise<void> {
    const service = await this.businessServiceRepository.findOne({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException('Business service not found');
    }
    await this.businessServiceRepository.remove(service);
  }
}
