import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../../entities/company.entity';

export enum RefundWindow {
  HOURS_72 = '72 hours',
  HOURS_48 = '48 hours',
  HOURS_24 = '24 hours',
  HOURS_4 = '4 hours',
}

@Entity('company_refund_policy')
@Index(['company_id'], { unique: true })
export class CompanyRefundPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  company_id: string;

  @OneToOne(() => Company, (company) => company.refund_policy, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ type: 'boolean', default: false })
  automatic_refunds: boolean;

  @Column({ type: 'boolean', default: false })
  require_deposit: boolean;

  @Column({ type: 'enum', enum: RefundWindow, nullable: true })
  refund_window?: RefundWindow | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
