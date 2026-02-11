import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Trade } from '../../modules/common/modules/trade/entities/trade.entity';

@ValidatorConstraint({ async: true })
@Injectable()
export class AreTradeUUIDsExistConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {
  }

  async validate(uuids: string[]) {
    if (!uuids || !Array.isArray(uuids) || uuids.length === 0) {
      return true;
    }

    const count = await this.tradeRepository.count({
      where: { id: In(uuids) },
    });

    return count === uuids.length;
  }

  defaultMessage() {
    return `Some or all of the provided IDs are invalid or do not exist.`;
  }
}

export function AreTradeUUIDsExist(validationOptions?: ValidationOptions) {
  return function(object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AreTradeUUIDsExistConstraint,
    });
  };
}
