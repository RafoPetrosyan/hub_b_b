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
import { BaseSpecialization } from '../../../../specialization/entities/specialization.entity';
import { User } from '../../../../business/modules/user/entities/user.entity';
import { Trade } from '../../../../common/modules/trade/entities/trade.entity';
import { CompanyService } from '../../../../business/modules/company/entities/company-service.entity';

@Entity('base_services')
export class BaseService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'specialization_id', type: 'uuid' })
  specialization_id: string;

  @Column({ name: 'trade_id', type: 'int' })
  trade_id: number;

  @Column({ name: 'duration_minutes', type: 'int' })
  duration_minutes: number;

  @Column({ name: 'required_staff', type: 'int', default: 1 })
  required_staff: number;

  @Column({ name: 'buffer_minutes', type: 'int', default: 0 })
  buffer_minutes: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @ManyToOne(() => BaseSpecialization, (specialization) => specialization.services)
  @JoinColumn({ name: 'specialization_id' })
  specialization: BaseSpecialization;

  @ManyToOne(() => Trade)
  @JoinColumn({ name: 'trade_id' })
  trade: Trade;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => CompanyService, (companyService) => companyService.service)
  companyServices?: CompanyService[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

