import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { BusinessForm } from './business-form.entity';
import { FormField } from './form-field.entity';

@Entity('business_form_field')
@Unique(['business_form_id', 'form_field_id'])
export class BusinessFormField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_form_id', type: 'uuid' })
  business_form_id: string;

  @Column({ name: 'form_field_id', type: 'uuid' })
  form_field_id: string;

  @Column({ name: 'label_override', type: 'varchar', length: 255, nullable: true })
  label_override: string;

  @Column({ name: 'is_required_override', type: 'boolean', nullable: true })
  is_required_override: boolean;

  @Column({ type: 'boolean', default: false })
  is_hidden: boolean;

  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sort_order: number;

  @Column({ name: 'settings_override', type: 'jsonb', nullable: true })
  settings_override: Record<string, any>;

  @ManyToOne(() => BusinessForm, (businessForm) => businessForm.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_form_id' })
  business_form: BusinessForm;

  @ManyToOne(() => FormField, (field) => field.business_form_fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'form_field_id' })
  form_field: FormField;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

