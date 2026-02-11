import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type BenefitItem = {
  name: string;
  children?: { name: string }[];
};
import { PlanOption } from './plan-option.entity';

@Entity({ name: 'tiers' })
export class Tier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  key: string; // solo | pro | enterprise

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', nullable: true })
  max_users?: number | null;

  @Column({ type: 'int', nullable: true })
  max_locations?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  benefits?: BenefitItem[] | null;

  @OneToMany(() => PlanOption, (planOption: PlanOption) => planOption.tier)
  plans: PlanOption[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
