import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne, Unique, JoinColumn,
} from 'typeorm';
import { AddOn } from '../../../../common/modules/add-ons/entities/add-on.entity';
import { Company } from '../../company/entities/company.entity';

@Entity({ name: 'company_addons' })
@Unique(['company_id', 'addon_id'])
export class CompanyAddOn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @Column({ type: 'uuid' })
  addon_id: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => AddOn, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addon_id' })
  addon: AddOn;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_subscription_item_id?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_product_id?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
