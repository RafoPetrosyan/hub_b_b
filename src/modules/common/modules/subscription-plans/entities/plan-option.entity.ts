import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tier } from './tier.entity';
import { PlanPrice } from './plan-price.entity';
import { PlanOptionAddOn } from '../../add-ons/entities/plan-option-addon.entity';

@Entity({ name: 'plan_options' })
export class PlanOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tier, { nullable: false })
  @JoinColumn({ name: 'tier_id' })
  tier: Tier;

  @Column({ type: 'uuid' })
  tier_id: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  key: string; // basics | growth | elite

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  benefits?: { name: string; children?: { name: string }[] }[] | null;

  @Column({ type: 'bigint', nullable: true })
  extra_practitioner_price_cents?: number | null;

  @Column({ type: 'boolean', default: false })
  website_included: boolean;

  @Column({ type: 'bigint', nullable: true })
  website_price_monthly_cents?: number | null;

  @Column({ type: 'bigint', nullable: true })
  website_price_yearly_cents?: number | null;

  @Column({ type: 'bigint', nullable: true })
  educator_upgrade_monthly_cents?: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_product_id?: string | null;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @OneToMany(() => PlanPrice, (p) => p.plan_option)
  prices?: PlanPrice[];

  @OneToMany(() => PlanOptionAddOn, (poa) => poa.planOption)
  plan_option_addons?: PlanOptionAddOn[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
