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
import { FormTemplate } from './form-template.entity';
import { User } from '../../business/modules/user/entities/user.entity';
import { FormField } from './form-field.entity';
import { BusinessForm } from './business-form.entity';

@Entity('form_template_version')
@Unique(['form_template_id', 'version'])
export class FormTemplateVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_template_id', type: 'uuid' })
  form_template_id: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => FormTemplate, (template) => template.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_template_id' })
  form_template: FormTemplate;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @OneToMany(() => FormField, (field) => field.form_template_version)
  fields: FormField[];

  @OneToMany(
    () => BusinessForm,
    (businessForm) => businessForm.form_template_version,
  )
  business_forms: BusinessForm[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}
