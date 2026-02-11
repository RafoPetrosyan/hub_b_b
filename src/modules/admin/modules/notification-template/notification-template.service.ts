import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationTemplate,
} from '../../../business/modules/notification-template/entities/notification-template.entity';
import {
  NotificationVariable,
} from '../../../business/modules/notification-template/entities/notification-variable.entity';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';
import {
  NotificationType as NotificationTypeEntity,
} from '../../../business/modules/notification-template/entities/notification-type.entity';
import { NotificationType } from '../../../business/modules/notification-template/enum/notification-type.enum';

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly notificationTemplateRepository: Repository<NotificationTemplate>,
    @InjectRepository(NotificationVariable)
    private readonly notificationVariableRepository: Repository<NotificationVariable>,
    @InjectRepository(NotificationTypeEntity)
    private readonly notificationTypeRepository: Repository<NotificationTypeEntity>,
  ) {
  }

  async list() {
    return this.notificationTemplateRepository.find({
      withDeleted: false,
      relations: {
        type: true,
      },
    });
  }

  async listTypes() {
    return this.notificationTypeRepository.find({
      withDeleted: false,
    });
  }

  async getOne(id: string) {
    const template = await this.notificationTemplateRepository.findOne({
      where: { id },
      relations: {
        type: {
          variables: true,
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  async create(dto: CreateNotificationTemplateDto, userId: string) {
    const exists = await this.notificationTemplateRepository.findOne({
      where: { type: { id: dto.type_id } },
    });
    const type = await this.notificationTypeRepository.findOne({
      where: { id: dto.type_id },
    });

    if (exists) {
      throw new ConflictException('Template type already exists');
    }

    // validate variables usage
    await this.validateVariables(dto.body, type.key);

    const template = this.notificationTemplateRepository.create({
      ...dto,
      created_by: userId,
    });

    return this.notificationTemplateRepository.save(template);
  }

  async update(id: string, dto: UpdateNotificationTemplateDto) {
    const template = await this.getOne(id);

    // validate variables usage
    await this.validateVariables(dto.body, template.type.key);

    Object.assign(template, dto);
    return this.notificationTemplateRepository.save(template);
  }

  async remove(id: string) {
    const template = await this.getOne(id);
    await this.notificationTemplateRepository.softDelete(template.id);
    return { status: 'deleted' };
  }

  async assignVariableToType(variableId: string, type: NotificationType) {
    const variable = await this.notificationVariableRepository.findOne({
      where: { id: variableId },
      relations: ['types'],
    });
    if (!variable) throw new NotFoundException('Variable not found');

    const notificationType = await this.notificationTypeRepository.findOne({
      where: { key: type },
      relations: ['variables'],
    });
    if (!notificationType)
      throw new NotFoundException('Notification type not found');

    // Check if already assigned
    const isAlreadyAssigned = variable.types.some(
      (t) => t.id === notificationType.id,
    );
    if (isAlreadyAssigned) {
      throw new ConflictException('Variable already assigned to this type');
    }

    // Add the type to the variable's types array
    variable.types.push(notificationType);
    await this.notificationVariableRepository.save(variable);

    return { status: 'assigned', variable, type: notificationType };
  }

  async unassignVariableFromType(variableId: string, type: NotificationType) {
    const variable = await this.notificationVariableRepository.findOne({
      where: { id: variableId },
      relations: ['types'],
    });
    if (!variable) throw new NotFoundException('Variable not found');

    const notificationType = await this.notificationTypeRepository.findOne({
      where: { key: type },
    });
    if (!notificationType)
      throw new NotFoundException('Notification type not found');

    // Check if assigned
    const typeIndex = variable.types.findIndex(
      (t) => t.id === notificationType.id,
    );
    if (typeIndex === -1) {
      throw new NotFoundException('Assignment not found');
    }

    // Remove the type from the variable's types array
    variable.types.splice(typeIndex, 1);
    await this.notificationVariableRepository.save(variable);

    return { status: 'unassigned' };
  }

  async listVariablesByType(type: NotificationType) {
    const notificationType = await this.notificationTypeRepository.findOne({
      where: { key: type },
      relations: ['variables'],
    });

    if (!notificationType) {
      return [];
    }

    return notificationType.variables;
  }

  /**
   * Ensures only allowed variables are used in template body
   */
  private async validateVariables(
    body: string | undefined,
    type: string,
  ) {
    if (!body) return;

    // fetch notification type entity by key
    const notificationType = await this.notificationTypeRepository.findOne({
      where: { key: type },
      relations: ['variables'],
    });

    if (!notificationType) {
      return; // If type doesn't exist, skip validation
    }

    const allowed = new Set(notificationType.variables.map(v => v.key));

    // find tokens like {{key}} or {{ key }}
    const matches = Array.from(new Set((body.match(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g) || [])));
    for (const m of matches) {
      const key = m.replace(/{{|}}/g, '').trim();
      if (!allowed.has(key)) {
        throw new ForbiddenException(`Variable "${key}" is not allowed for notification type "${type}"`);
      }
    }
  }
}
