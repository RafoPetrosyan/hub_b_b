import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyPolicy } from './company-policy.entity';

@Entity('policies')
@Index(['slug'], { unique: true })
export class Policy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'boolean', default: true })
  default_state: boolean;

  @Column({ type: 'text', nullable: true })
  default_text?: string | null;

  @Column({ type: 'boolean', default: false })
  is_additional: boolean;

  @Column({ type: 'jsonb', nullable: true })
  fields?: Record<string, any> | any[] | null;

  @OneToMany(() => CompanyPolicy, (companyPolicy) => companyPolicy.policy)
  company_policies?: CompanyPolicy[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
