import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { AddOn } from './add-on.entity';
import { PlanOption } from '../../subscription-plans/entities/plan-option.entity';

@Entity({ name: 'plan_option_addons' })
export class PlanOptionAddOn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  plan_option_id: string;

  @ManyToOne(() => PlanOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_option_id' })
  planOption?: PlanOption;

  @Index()
  @Column({ type: 'uuid' })
  addon_id: string;

  @ManyToOne(() => AddOn, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addon_id' })
  addon?: AddOn;

  @Column({ type: 'boolean', default: false })
  included: boolean;

  @Column({ type: 'bigint', nullable: true })
  price_cents?: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_price_id?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
