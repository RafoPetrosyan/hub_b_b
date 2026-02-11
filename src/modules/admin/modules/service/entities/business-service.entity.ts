import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../../../business/modules/company/entities/company.entity';
import { BusinessSpecialization } from '../../../../specialization/entities/business-specialization.entity';

@Entity('company_services')
export class BusinessService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  business_id: string;

  @Column({ name: 'specialization_id', type: 'uuid' })
  specialization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  duration_minutes: number | null;

  @Column({ name: 'required_staff', type: 'int', nullable: true })
  required_staff: number | null;

  @Column({ name: 'buffer_minutes', type: 'int', nullable: true })
  buffer_minutes: number | null;

  @Column({ name: 'price', type: 'int', default: 0 })
  price: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'business_id' })
  business: Company;

  @ManyToOne(() => BusinessSpecialization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'specialization_id' })
  specialization: BusinessSpecialization;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

