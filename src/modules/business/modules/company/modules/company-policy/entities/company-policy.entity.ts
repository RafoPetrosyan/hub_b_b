import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Policy } from './policy.entity';
import { Company } from '../../../entities/company.entity';

@Entity('company_policies')
@Index(['company_id', 'policy_id'], { unique: true })
export class CompanyPolicy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'policy_id' })
  policy_id: string;

  @ManyToOne(() => Policy, (policy) => policy.company_policies, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policy_id' })
  policy?: Policy;

  @Column({ type: 'uuid', name: 'company_id' })
  company_id: string;

  @ManyToOne(() => Company, (company) => company.policies, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any> | null;

  @Column({ type: 'boolean', default: true })
  state: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
