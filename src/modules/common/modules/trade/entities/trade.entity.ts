import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../../business/modules/user/entities/user.entity';
import { Company } from '../../../../business/modules/company/entities/company.entity';
import { BaseSpecialization } from '../../../../specialization/entities/specialization.entity';
import { Location } from '../../../../business/modules/location/entities/location.entity';
import { TradeGroup } from './trade-group.entity';

@Entity('trade')
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', nullable: false })
  @Index()
  group_id: string;

  @ManyToOne(() => TradeGroup, (tradeGroup) => tradeGroup.trades, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: TradeGroup;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  creator_company_id?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'creator_company_id' })
  creator_company: Company;

  @ManyToMany(() => Company, (company) => company.trades)
  companies: Company[];

  @ManyToMany(() => Location, (location) => location.trades)
  locations: Location[];

  @OneToMany(() => BaseSpecialization, (specialization) => specialization.trade)
  baseSpecializations: BaseSpecialization[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}
