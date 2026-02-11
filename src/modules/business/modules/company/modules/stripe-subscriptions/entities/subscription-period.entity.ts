import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CompanySubscription } from './company-subscription.entity';

@Entity({ name: 'subscription_periods' })
export class SubscriptionPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CompanySubscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_subscription_id' })
  company_subscription: CompanySubscription;

  @Column({ type: 'uuid' })
  @Index()
  company_subscription_id: string;

  @Column({ type: 'timestamptz' })
  period_start: Date;

  @Column({ type: 'timestamptz' })
  period_end: Date;

  @Column({ type: 'bigint', nullable: true })
  amount_cents?: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currency?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoice_id?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
