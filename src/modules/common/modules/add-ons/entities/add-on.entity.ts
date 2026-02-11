import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CompanyAddOn } from '../../../../business/modules/add-ons/entities/add-on.entity';

@Entity({ name: 'addons' })
export class AddOn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  detailed_description?: string | null;

  @Column({ type: 'text', nullable: true })
  best_for?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  benefits?: { name: string; children?: { name: string }[] }[] | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'bigint', default: 0 })
  price_cents: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_product_id?: string | null;

  @OneToMany(() => CompanyAddOn, (companyAddOn) => companyAddOn.addon)
  companyAddOns?: CompanyAddOn[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null;
}
