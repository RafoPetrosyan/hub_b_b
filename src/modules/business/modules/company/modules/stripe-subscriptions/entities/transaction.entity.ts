import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  UNKNOWN = 'unknown',
}

@Entity({ name: 'stripe_transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  stripe_event_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  stripe_object_id?: string | null; // e.g., payment_intent/charge/invoice

  @Column({ type: 'varchar', length: 100, nullable: true })
  type?: string | null; // stripe event type

  @Column({ type: 'integer', nullable: true })
  company_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  company_subscription_id?: string | null;

  @Column({ type: 'bigint', nullable: true })
  amount_cents?: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status?: TransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  raw?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
