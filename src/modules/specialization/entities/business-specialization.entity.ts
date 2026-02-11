import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../business/modules/company/entities/company.entity';
import { BusinessService } from '../../admin/modules/service/entities/business-service.entity';

@Entity('company_specializations')
export class BusinessSpecialization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_id', type: 'uuid' })
  business_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'business_id' })
  business: Company;

  @OneToMany(() => BusinessService, (service) => service.specialization)
  services?: BusinessService[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}


