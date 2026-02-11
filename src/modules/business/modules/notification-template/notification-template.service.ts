import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from './entities/notification-template.entity';
import { CompanyNotificationTemplate } from './entities/company-notification-template.entity';
import { NotificationVariable } from './entities/notification-variable.entity';
import { NotificationType } from './enum/notification-type.enum';
import { NotificationType as NotificationTypeEntity } from './entities/notification-type.entity';

@Injectable()
export class NotificationTemplateService {
  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly notificationTemplateRepository: Repository<NotificationTemplate>,
    @InjectRepository(CompanyNotificationTemplate)
    private readonly companyNotificationTemplateRepository: Repository<CompanyNotificationTemplate>,
    @InjectRepository(NotificationVariable)
    private readonly notificationVariableRepository: Repository<NotificationVariable>,
    @InjectRepository(NotificationTypeEntity)
    private readonly notificationTypeRepository: Repository<NotificationTypeEntity>,
  ) {
  }

  /**
   * Returns all templates for a company:
   * base templates merged with company overrides
   */
  async listForCompany(userId: string, companyId: string) {
    let companyTemplates =
      await this.companyNotificationTemplateRepository.find({
        where: { company_id: companyId, deleted_at: null },
        relations: ['type'],
      });
    const adminTemplates = await this.notificationTemplateRepository.find({
      relations: ['type'],
    });
    if (companyTemplates.length < adminTemplates.length) {
      for (const adminTemplate of adminTemplates) {
        if (
          !companyTemplates.find(
            (companyTemplate) =>
              companyTemplate.base_template_id === adminTemplate.id,
          )
        ) {
          const newTemplate = this.companyNotificationTemplateRepository.create(
            {
              company_id: companyId,
              base_template_id: adminTemplate.id,
              type: { id: adminTemplate.type.id },
              name: adminTemplate.name,
              title: adminTemplate.title,
              body: adminTemplate.body,
              provider: adminTemplate.provider,
              created_by: userId,
            },
          );

          await this.companyNotificationTemplateRepository.save(newTemplate);
        }
      }

      // Refresh list
      companyTemplates = await this.companyNotificationTemplateRepository.find({
        where: { company_id: companyId, deleted_at: null },
        relations: ['type'],
      });
    }

    return companyTemplates;
  }

  /**
   * Get single template with variables
   */
  async getForCompany(templateId: string, companyId: string) {
    const companyTemplate =
      await this.companyNotificationTemplateRepository.findOne({
        where: { id: templateId, company_id: companyId },
        relations: {
          base_template: {
            type: {
              variables: true,
            },
          },
        },
      });

    if (companyTemplate) {
      return {
        ...companyTemplate,
        variables: companyTemplate.base_template?.type.variables ?? [],
      };
    }

    const baseTemplate = await this.notificationTemplateRepository.findOne({
      where: { id: templateId },
      relations: ['variables'],
    });

    if (!baseTemplate) {
      throw new NotFoundException('Template not found');
    }

    return {
      ...baseTemplate,
      is_overridden: false,
    };
  }

  /**
   * Create or update company override
   */
  async updateCompanyTemplate(
    templateId: string,
    companyId: string,
    userId: string,
    dto: { title?: string | null; body?: string },
  ) {
    let companyTemplate =
      await this.companyNotificationTemplateRepository.findOne({
        where: {
          id: templateId,
          company_id: companyId,
        },
        relations: {
          base_template: {
            type: true,
          },
        },
      });

    if (!companyTemplate) {
      throw new NotFoundException('Template not found');
    }

    const baseTemplate = companyTemplate.base_template;

    if (!baseTemplate) {
      throw new NotFoundException('Base template not found');
    }

    await this.validateVariables(dto.body, baseTemplate.type.key);

    companyTemplate.title = dto.title ?? companyTemplate.title;
    companyTemplate.body = dto.body ?? companyTemplate.body;

    await this.companyNotificationTemplateRepository.save(companyTemplate);

    return companyTemplate;
  }

  /**
   * Reset company template to base version
   */
  async resetToBase(templateId: string, companyId: string) {
    const companyTemplate =
      await this.companyNotificationTemplateRepository.findOne({
        where: { id: templateId, company_id: companyId },
        relations: {
          base_template: true,
        },
      });

    if (!companyTemplate) {
      throw new NotFoundException('Company template not found');
    }

    if (!companyTemplate.base_template) {
      throw new NotFoundException('Base template not found');
    }

    companyTemplate.title = companyTemplate.base_template.title;
    companyTemplate.body = companyTemplate.base_template.body;
    companyTemplate.last_sync_date = new Date();

    await this.companyNotificationTemplateRepository.save(companyTemplate);

    return {
      status: 'reset', message: 'Template reset to base version', companyTemplate: {
        ...companyTemplate,
        base_template: undefined,
      },
    };
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
  private async validateVariables(body: string | undefined, type: string) {
    if (!body) return;

    // fetch notification type entity by key
    const notificationType = await this.notificationTypeRepository.findOne({
      where: { key: type },
      relations: ['variables'],
    });

    if (!notificationType) {
      return; // If type doesn't exist, skip validation
    }

    const allowed = new Set(notificationType.variables.map((v) => v.key));

    // find tokens like {{key}} or {{ key }}
    const matches = Array.from(
      new Set(body.match(/{{\s*([A-Za-z0-9_.-]+)\s*}}/g) || []),
    );
    for (const m of matches) {
      const key = m.replace(/{{|}}/g, '').trim();
      if (!allowed.has(key)) {
        throw new ForbiddenException(
          `Variable "${key}" is not allowed for notification type "${type}"`,
        );
      }
    }
  }
}
