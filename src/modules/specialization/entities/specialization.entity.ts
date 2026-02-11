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
import { BaseService } from '../../admin/modules/service/entities/base-service.entity';
import { Trade } from '../../common/modules/trade/entities/trade.entity';

@Entity('base_specializations')
export class BaseSpecialization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'trade_id', type: 'int' })
  trade_id: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Trade, (trade) => trade.baseSpecializations)
  @JoinColumn({ name: 'trade_id' })
  trade: Trade;

  @OneToMany(() => BaseService, (service) => service.specialization)
  services: BaseService[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}

