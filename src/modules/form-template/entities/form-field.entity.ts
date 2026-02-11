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
import { FormTemplateVersion } from './form-template-version.entity';
import { BusinessFormField } from './business-form-field.entity';

@Entity('form_field')
@Unique(['form_template_version_id', 'name'])
export class FormField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'form_template_version_id', type: 'uuid' })
  form_template_version_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({ name: 'field_type', type: 'varchar', length: 50 })
  field_type: string;

  @Column({ type: 'boolean', default: false })
  is_required: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder: string;

  @Column({ name: 'help_text', type: 'text', nullable: true })
  help_text: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'jsonb', default: '{}' })
  settings: Record<string, any>;

  @ManyToOne(() => FormTemplateVersion, (version) => version.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_template_version_id' })
  form_template_version: FormTemplateVersion;

  @OneToMany(() => BusinessFormField, (businessField) => businessField.form_field)
  business_form_fields: BusinessFormField[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

