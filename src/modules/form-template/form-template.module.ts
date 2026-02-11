import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormTemplateService } from './form-template.service';
import { FormTemplateController } from './form-template.controller';
import { FormTemplate } from './entities/form-template.entity';
import { FormTemplateVersion } from './entities/form-template-version.entity';
import { FormField } from './entities/form-field.entity';
import { BusinessForm } from './entities/business-form.entity';
import { BusinessFormField } from './entities/business-form-field.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FormTemplate,
      FormTemplateVersion,
      FormField,
      BusinessForm,
      BusinessFormField,
    ]),
  ],
  controllers: [FormTemplateController],
  providers: [FormTemplateService],
  exports: [FormTemplateService],
})
export class FormTemplateModule {
}


