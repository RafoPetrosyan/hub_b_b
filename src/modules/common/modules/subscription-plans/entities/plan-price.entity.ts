import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PlanOption } from './plan-option.entity';

export type PriceInterval = 'monthly' | 'yearly';

@Entity({ name: 'plan_prices' })
export class PlanPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PlanOption, { nullable: false })
  @JoinColumn({ name: 'plan_option_id' })
  plan_option: PlanOption;

  @Column({ type: 'uuid' })
  plan_option_id: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  interval: PriceInterval;

  @Column({ type: 'bigint' })
  price_cents: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_price_id?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
