import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Company } from './company.entity';
import { BaseService } from '../../../../admin/modules/service/entities/base-service.entity';

@Entity('company_base_services')
@Unique(['company_id', 'service_id'])
export class CompanyService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => BaseService, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: BaseService;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
