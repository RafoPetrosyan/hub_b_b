import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { BaseSpecialization } from './entities/specialization.entity';
import { BusinessSpecialization } from './entities/business-specialization.entity';
import { CreateBaseSpecializationDto } from './dto/create-specialization.dto';
import { UpdateBaseSpecializationDto } from './dto/update-specialization.dto';
import { GetBaseSpecializationDto } from './dto/get-specialization.dto';
import { CreateBusinessSpecializationDto } from './dto/create-business-specialization.dto';
import { UpdateBusinessSpecializationDto } from './dto/update-business-specialization.dto';
import { GetBusinessSpecializationDto } from './dto/get-business-specialization.dto';
import { Company } from '../business/modules/company/entities/company.entity';
import { Trade } from '../common/modules/trade/entities/trade.entity';

@Injectable()
export class SpecializationService {
  constructor(
    @InjectRepository(BaseSpecialization)
    private readonly baseSpecializationRepository: Repository<BaseSpecialization>,
    @InjectRepository(BusinessSpecialization)
    private readonly businessSpecializationRepository: Repository<BusinessSpecialization>,
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {
  }

  // Base Specialization CRUD
  async findAllBaseSpecializations(tradeId?: number): Promise<GetBaseSpecializationDto[]> {
    return await this.baseSpecializationRepository.find({
      ...(tradeId && { where: { trade_id: tradeId } }),
      relations: ['trade'],
      order: { created_at: 'DESC' },
    });
  }

  async findOneBaseSpecialization(id: string): Promise<GetBaseSpecializationDto> {
    const specialization = await this.baseSpecializationRepository.findOne({
      where: { id },
      relations: ['trade'],
    });
    if (!specialization) {
      throw new NotFoundException('Base specialization not found');
    }
    return plainToClass(GetBaseSpecializationDto, specialization, {
      excludeExtraneousValues: true,
    });
  }

  async createBaseSpecialization(
    createBaseSpecializationDto: CreateBaseSpecializationDto,
  ): Promise<GetBaseSpecializationDto> {
    // Verify that the trade exists
    const trade = await this.tradeRepository.findOne({
      where: { id: createBaseSpecializationDto.trade_id },
    });
    if (!trade) {
      throw new NotFoundException('Trade not found');
    }

    const specialization = this.baseSpecializationRepository.create({
      ...createBaseSpecializationDto,
      is_active: createBaseSpecializationDto.is_active ?? true,
    });
    const savedSpecialization =
      await this.baseSpecializationRepository.save(specialization);
    return plainToClass(GetBaseSpecializationDto, savedSpecialization, {
      excludeExtraneousValues: true,
    });
  }

  async updateBaseSpecialization(
    id: string,
    updateBaseSpecializationDto: UpdateBaseSpecializationDto,
  ): Promise<GetBaseSpecializationDto> {
    const specialization = await this.baseSpecializationRepository.findOne({
      where: { id },
    });
    if (!specialization) {
      throw new NotFoundException('Base specialization not found');
    }

    // If trade_id is being updated, verify the new trade exists
    if (updateBaseSpecializationDto.trade_id) {
      const trade = await this.tradeRepository.findOne({
        where: { id: updateBaseSpecializationDto.trade_id },
      });
      if (!trade) {
        throw new NotFoundException('Trade not found');
      }
    }

    Object.assign(specialization, updateBaseSpecializationDto);
    const updatedSpecialization =
      await this.baseSpecializationRepository.save(specialization);
    return plainToClass(GetBaseSpecializationDto, updatedSpecialization, {
      excludeExtraneousValues: true,
    });
  }

  async removeBaseSpecialization(id: string): Promise<void> {
    const specialization = await this.baseSpecializationRepository.findOne({
      where: { id },
    });
    if (!specialization) {
      throw new NotFoundException('Base specialization not found');
    }
    await this.baseSpecializationRepository.remove(specialization);
  }

  // Business Specialization CRUD
  async findAllBusinessSpecializations(): Promise<GetBusinessSpecializationDto[]> {
    return await this.businessSpecializationRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOneBusinessSpecialization(id: string): Promise<GetBusinessSpecializationDto> {
    const specialization = await this.businessSpecializationRepository.findOne({
      where: { id },
    });
    if (!specialization) {
      throw new NotFoundException('Business specialization not found');
    }
    return specialization;
  }

  async createBusinessSpecialization(
    createBusinessSpecializationDto: CreateBusinessSpecializationDto,
  ): Promise<GetBusinessSpecializationDto> {
    // Verify that the business exists
    const business = await this.companyRepository.findOne({
      where: { id: createBusinessSpecializationDto.business_id },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const specialization = this.businessSpecializationRepository.create({
      ...createBusinessSpecializationDto,
      is_active: createBusinessSpecializationDto.is_active ?? true,
    });
    return await this.businessSpecializationRepository.save(specialization);
  }

  async updateBusinessSpecialization(
    id: string,
    updateBusinessSpecializationDto: UpdateBusinessSpecializationDto,
  ): Promise<GetBusinessSpecializationDto> {
    const specialization = await this.businessSpecializationRepository.findOne({
      where: { id },
    });
    if (!specialization) {
      throw new NotFoundException('Business specialization not found');
    }

    // If business_id is being updated, verify the new business exists
    if (updateBusinessSpecializationDto.business_id) {
      const business = await this.companyRepository.findOne({
        where: { id: updateBusinessSpecializationDto.business_id },
      });
      if (!business) {
        throw new NotFoundException('Business not found');
      }
    }

    Object.assign(specialization, updateBusinessSpecializationDto);
    return await this.businessSpecializationRepository.save(specialization);
  }

  async removeBusinessSpecialization(id: string): Promise<void> {
    const specialization = await this.businessSpecializationRepository.findOne({
      where: { id },
    });
    if (!specialization) {
      throw new NotFoundException('Business specialization not found');
    }
    await this.businessSpecializationRepository.remove(specialization);
  }
}
