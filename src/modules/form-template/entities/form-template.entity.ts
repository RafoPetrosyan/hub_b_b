import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../business/modules/company/entities/company.entity';
import { User } from '../../business/modules/user/entities/user.entity';
import { FormTemplateVersion } from './form-template-version.entity';
import { Trade } from '../../common/modules/trade/entities/trade.entity';

@Entity('form_template')
export class FormTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'trade_id', type: 'uuid' })
  trade_id: string;

  @Column({ name: 'business_id', type: 'uuid', nullable: true })
  business_id: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string | null;

  @ManyToOne(() => Trade)
  @JoinColumn({ name: 'trade_id' })
  trade: Trade;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'business_id' })
  business: Company | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @OneToMany(() => FormTemplateVersion, (version) => version.form_template)
  versions: FormTemplateVersion[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

