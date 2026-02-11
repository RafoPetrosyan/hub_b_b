import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Company } from '../../business/modules/company/entities/company.entity';
import { FormTemplateVersion } from './form-template-version.entity';
import { BusinessFormField } from './business-form-field.entity';

@Entity('business_form')
@Unique(['business_id', 'form_template_version_id'])
export class BusinessForm {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  business_id: string;

  @Column({ name: 'form_template_version_id', type: 'uuid' })
  form_template_version_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business: Company;

  @ManyToOne(() => FormTemplateVersion, (version) => version.business_forms)
  @JoinColumn({ name: 'form_template_version_id' })
  form_template_version: FormTemplateVersion;

  @OneToMany(() => BusinessFormField, (field) => field.business_form)
  fields: BusinessFormField[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

