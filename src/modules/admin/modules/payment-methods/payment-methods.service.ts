import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {
  }

  async list() {
    return this.paymentMethodRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getById(id: string) {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
    });
    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }
    return paymentMethod;
  }

  async create(dto: CreatePaymentMethodDto) {
    const name = dto.name.trim();
    const existing = await this.paymentMethodRepository.findOne({
      where: { name },
    });
    if (existing) {
      throw new ConflictException('Payment method already exists');
    }

    const entity = this.paymentMethodRepository.create({
      name,
      description: dto.description ?? null,
      default_state: dto.default_state ?? true,
    });
    return this.paymentMethodRepository.save(entity);
  }

  async update(id: string, dto: UpdatePaymentMethodDto) {
    const paymentMethod = await this.getById(id);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name && name !== paymentMethod.name) {
        const existing = await this.paymentMethodRepository.findOne({
          where: { name },
        });
        if (existing && existing.id !== paymentMethod.id) {
          throw new ConflictException('Payment method already exists');
        }
      }
      paymentMethod.name = name;
    }
    if (dto.description !== undefined) {
      paymentMethod.description = dto.description ?? null;
    }
    if (dto.default_state !== undefined) {
      paymentMethod.default_state = dto.default_state;
    }

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async remove(id: string) {
    const paymentMethod = await this.getById(id);
    await this.paymentMethodRepository.remove(paymentMethod);
    return { success: true };
  }
}
