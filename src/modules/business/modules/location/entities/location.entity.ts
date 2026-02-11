import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { LocationStatus } from '../enum/location-status.enum';
import { LocationAddress } from './location-address.entity';
import { User } from '../../user/entities/user.entity';
import { LocationWorkingHours } from './location-working-hours.entity';
import { Trade } from '../../../../common/modules/trade/entities/trade.entity';

@Entity('location')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    default: LocationStatus.ACTIVE,
  })
  status: LocationStatus;

  @Column({
    type: 'boolean',
    default: false,
  })
  is_primary: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  type?: string | null;

  @OneToMany(() => User, (user) => user.location)
  users: User[];

  @ManyToMany(() => Trade)
  @JoinTable({
    name: 'location_trades',
    joinColumn: { name: 'location_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'trade_id', referencedColumnName: 'id' },
  })
  trades: Trade[];

  @OneToOne(() => LocationAddress, (address) => address.location, {
    onDelete: 'CASCADE',
  })
  address: LocationAddress;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  company_id: string;

  @ManyToOne(() => Company, (company) => company.locations)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(
    () => LocationWorkingHours,
    wh => wh.location,
    { cascade: true },
  )
  workingHours: LocationWorkingHours[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt?: Date;
}
