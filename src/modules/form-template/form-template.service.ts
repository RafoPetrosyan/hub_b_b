import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { FormTemplate } from './entities/form-template.entity';
import { FormTemplateVersion } from './entities/form-template-version.entity';
import { FormField } from './entities/form-field.entity';
import { BusinessForm } from './entities/business-form.entity';
import { BusinessFormField } from './entities/business-form-field.entity';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { GetFormTemplateDto } from './dto/get-form-template.dto';
import { CreateBusinessFormDto } from './dto/create-business-form.dto';

@Injectable()
export class FormTemplateService {
  constructor(
    @InjectRepository(FormTemplate)
    private readonly formTemplateRepository: Repository<FormTemplate>,
    @InjectRepository(FormTemplateVersion)
    private readonly formTemplateVersionRepository: Repository<FormTemplateVersion>,
    @InjectRepository(FormField)
    private readonly formFieldRepository: Repository<FormField>,
    @InjectRepository(BusinessForm)
    private readonly businessFormRepository: Repository<BusinessForm>,
    @InjectRepository(BusinessFormField)
    private readonly businessFormFieldRepository: Repository<BusinessFormField>,
    private readonly dataSource: DataSource,
  ) {
  }

  async findAll(): Promise<GetFormTemplateDto[]> {
    return await this.formTemplateRepository
      .createQueryBuilder('formTemplate')
      .leftJoinAndSelect('formTemplate.versions', 'versions')
      .leftJoinAndSelect('versions.fields', 'fields')
      .leftJoin('formTemplate.trade', 'trade')
      .addSelect(['trade.id', 'trade.name'])
      .orderBy('formTemplate.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<GetFormTemplateDto> {
    const template = await this.formTemplateRepository.findOne({
      where: { id },
      relations: ['versions', 'versions.fields', 'trade'],
      order: { versions: { version: 'DESC' } },
    });
    if (!template) {
      throw new NotFoundException('Form template not found');
    }
    return template;
  }

  async findByTrade(tradeId: string): Promise<GetFormTemplateDto[]> {
    return await this.formTemplateRepository.find({
      where: { trade_id: tradeId },
      relations: ['versions', 'versions.fields'],
      order: { created_at: 'DESC' },
    });
  }

  async findByBusiness(businessId: string): Promise<GetFormTemplateDto[]> {
    return await this.formTemplateRepository.find({
      where: { business_id: businessId },
      relations: ['versions', 'versions.fields'],
      order: { created_at: 'DESC' },
    });
  }

  async create(
    createFormTemplateDto: CreateFormTemplateDto,
    userId?: string,
  ): Promise<GetFormTemplateDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create form template
      const template = this.formTemplateRepository.create({
        name: createFormTemplateDto.name,
        description: createFormTemplateDto.description,
        trade_id: createFormTemplateDto.trade_id,
        business_id: createFormTemplateDto.business_id || null,
        is_active: createFormTemplateDto.is_active ?? true,
        created_by: userId || null,
      });
      const savedTemplate = await queryRunner.manager.save(template);

      // Create initial version if provided
      if (createFormTemplateDto.version) {
        const version = this.formTemplateVersionRepository.create({
          form_template_id: savedTemplate.id,
          version: createFormTemplateDto.version.version,
          is_active: createFormTemplateDto.version.is_active ?? true,
          created_by: userId || null,
        });
        const savedVersion = await queryRunner.manager.save(version);

        // Create fields if provided
        if (createFormTemplateDto.version.fields) {
          const fields = createFormTemplateDto.version.fields.map((fieldDto) =>
            this.formFieldRepository.create({
              form_template_version_id: savedVersion.id,
              name: fieldDto.name,
              label: fieldDto.label,
              field_type: fieldDto.field_type,
              is_required: fieldDto.is_required ?? false,
              placeholder: fieldDto.placeholder,
              help_text: fieldDto.help_text,
              sort_order: fieldDto.sort_order ?? 0,
              settings: fieldDto.settings || {},
            }),
          );
          await queryRunner.manager.save(fields);
        }
      }

      await queryRunner.commitTransaction();

      // Fetch the complete template with relations
      return await this.formTemplateRepository.findOne({
        where: { id: savedTemplate.id },
        relations: ['versions', 'versions.fields'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    updateFormTemplateDto: UpdateFormTemplateDto,
  ): Promise<GetFormTemplateDto> {
    const template = await this.formTemplateRepository.findOne({
      where: { id },
      relations: ['versions', 'versions.fields'],
    });
    if (!template) {
      throw new NotFoundException('Form template not found');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if any business has used this template
      const versionIds = template.versions?.map((v) => v.id) || [];
      let hasBusinessUsage = false;

      if (versionIds.length > 0) {
        const businessFormCount = await queryRunner.manager.count(
          BusinessForm,
          {
            where: {
              form_template_version_id: In(versionIds),
            },
          },
        );
        hasBusinessUsage = businessFormCount > 0;
      }

      // Update template metadata
      const { fields, ...templateData } = updateFormTemplateDto;
      Object.assign(template, templateData);
      const updatedTemplate = await queryRunner.manager.save(template);

      // Update fields if provided
      if (fields !== undefined) {
        if (hasBusinessUsage) {
          // If any business has used this template, create a new version instead of updating
          // Find the latest version number
          let latestVersionNumber = 0;
          if (template.versions && template.versions.length > 0) {
            latestVersionNumber = template.versions.reduce(
              (max, current) => Math.max(max, current.version),
              0,
            );
          }

          // Set all old versions to inactive
          if (template.versions && template.versions.length > 0) {
            await queryRunner.manager.update(
              FormTemplateVersion,
              { form_template_id: id },
              { is_active: false },
            );
          }

          // Create new version
          const newVersion = this.formTemplateVersionRepository.create({
            form_template_id: id,
            version: latestVersionNumber + 1,
            is_active: true,
            created_by: template.created_by,
          });
          const savedVersion = await queryRunner.manager.save(newVersion);

          // Create new fields for the new version
          if (fields.length > 0) {
            const formFields = fields.map((fieldDto) =>
              this.formFieldRepository.create({
                form_template_version_id: savedVersion.id,
                name: fieldDto.name,
                label: fieldDto.label,
                field_type: fieldDto.field_type,
                is_required: fieldDto.is_required ?? false,
                placeholder: fieldDto.placeholder,
                help_text: fieldDto.help_text,
                sort_order: fieldDto.sort_order ?? 0,
                settings: fieldDto.settings || {},
              }),
            );
            await queryRunner.manager.save(formFields);
          }
        } else {
          // No business usage, proceed with normal update
          // Find the active version, or the latest version if no active version exists
          let targetVersion = template.versions?.find((v) => v.is_active);
          if (
            !targetVersion &&
            template.versions &&
            template.versions.length > 0
          ) {
            // Get the latest version by version number
            targetVersion = template.versions.reduce((latest, current) => {
              return current.version > latest.version ? current : latest;
            });
          }

          if (!targetVersion) {
            throw new BadRequestException(
              'No version found for this template. Please create a version first.',
            );
          }

          // Delete existing fields for this version
          await queryRunner.manager.delete(FormField, {
            form_template_version_id: targetVersion.id,
          });

          // Create new fields if provided
          if (fields.length > 0) {
            const formFields = fields.map((fieldDto) =>
              this.formFieldRepository.create({
                form_template_version_id: targetVersion.id,
                name: fieldDto.name,
                label: fieldDto.label,
                field_type: fieldDto.field_type,
                is_required: fieldDto.is_required ?? false,
                placeholder: fieldDto.placeholder,
                help_text: fieldDto.help_text,
                sort_order: fieldDto.sort_order ?? 0,
                settings: fieldDto.settings || {},
              }),
            );
            await queryRunner.manager.save(formFields);
          }
        }
      }

      await queryRunner.commitTransaction();

      // Fetch the complete template with relations
      return await this.formTemplateRepository.findOne({
        where: { id: updatedTemplate.id },
        relations: ['versions', 'versions.fields'],
        order: { versions: { version: 'DESC' } },
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const template = await this.formTemplateRepository.findOne({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Form template not found');
    }
    await this.formTemplateRepository.remove(template);
  }

  async createBusinessForm(
    createBusinessFormDto: CreateBusinessFormDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if business form already exists
      const existing = await this.businessFormRepository.findOne({
        where: {
          business_id: createBusinessFormDto.business_id,
          form_template_version_id:
          createBusinessFormDto.form_template_version_id,
        },
      });
      if (existing) {
        throw new BadRequestException(
          'Business form already exists for this template version',
        );
      }

      const businessForm = this.businessFormRepository.create({
        business_id: createBusinessFormDto.business_id,
        form_template_version_id:
        createBusinessFormDto.form_template_version_id,
        name: createBusinessFormDto.name,
        is_active: createBusinessFormDto.is_active ?? true,
      });
      const savedBusinessForm = await queryRunner.manager.save(businessForm);

      // Create field overrides if provided
      if (createBusinessFormDto.fields) {
        const businessFormFields = createBusinessFormDto.fields.map(
          (fieldDto) =>
            this.businessFormFieldRepository.create({
              business_form_id: savedBusinessForm.id,
              form_field_id: fieldDto.form_field_id,
              label_override: fieldDto.label_override,
              is_required_override: fieldDto.is_required_override,
              is_hidden: fieldDto.is_hidden ?? false,
              sort_order: fieldDto.sort_order,
              settings_override: fieldDto.settings_override,
            }),
        );
        await queryRunner.manager.save(businessFormFields);
      }

      await queryRunner.commitTransaction();

      return await this.businessFormRepository.findOne({
        where: { id: savedBusinessForm.id },
        relations: ['fields', 'fields.form_field'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getBusinessForms(businessId: string): Promise<any[]> {
    return await this.businessFormRepository.find({
      where: { business_id: businessId },
      relations: [
        'form_template_version',
        'form_template_version.form_template',
        'form_template_version.fields',
        'fields',
        'fields.form_field',
      ],
    });
  }
}
