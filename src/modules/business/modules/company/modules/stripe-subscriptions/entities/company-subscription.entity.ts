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
import { Company } from '../../../entities/company.entity';

export enum CompanySubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
  EXPIRED = 'expired',
}

@Entity({ name: 'company_subscriptions' })
export class CompanySubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid' })
  @Index()
  company_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_customer_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_subscription_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_price_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  plan_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  price_id?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  plan_snapshot?: any | null;

  @Column({ type: 'jsonb', nullable: true })
  addons_snapshot?: any | null;

  @Column({ type: 'jsonb', nullable: true })
  addon_ids?: string[] | null;

  @Column({ type: 'int', nullable: true })
  max_users?: number | null;

  @Column({ type: 'enum', enum: CompanySubscriptionStatus, nullable: true })
  status?: CompanySubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  current_period_start?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  current_period_end?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  subscription_expires_at?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
