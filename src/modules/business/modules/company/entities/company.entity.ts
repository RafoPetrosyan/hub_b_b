import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Location } from '../../location/entities/location.entity';
import { CompanyAddress } from '../modules/company-address/entities/company-address.entity';
import { EntityType } from '../enum/entity-type.enum';
import { PolymorphicRelation } from '../../../../../db/polymorph/polymorphic.decorator';
import { Media } from '../../../../common/modules/media/media.entity';
import { PolymorphicService } from '../../../../../db/polymorph/polymorphic.service';
import { Trade } from '../../../../common/modules/trade/entities/trade.entity';
import { CompanyService } from './company-service.entity';
import { CompanyAddOn } from '../../add-ons/entities/add-on.entity';
import { CompanyBooking } from '../modules/company-profile/entities/company-booking.entity';
import { CompanyPolicy } from '../modules/company-policy/entities/company-policy.entity';
import { CompanyRefundPolicy } from '../modules/refund-policy/entities/company-refund-policy.entity';
import {
  CompanyDepositRequirement,
} from '../modules/deposit-requirements/entities/company-deposit-requirement.entity';
import { CompanyPaymentMethod } from '../modules/company-payment-methods/entities/company-payment-method.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'business_name', type: 'varchar', length: 255, nullable: true })
  business_name?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  subdomain?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string;

  @Column({ name: 'legal_name', type: 'varchar', length: 255, nullable: true })
  legal_name?: string;

  @Column({ name: 'dba_name', type: 'varchar', length: 255, nullable: true })
  dba_name?: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: EntityType,
    nullable: true,
  })
  entity_type?: EntityType;

  @Column({
    name: 'registration_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  registration_number?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  ein?: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_customer_id?: string;

  @Column({ type: 'boolean', default: false })
  has_schedule?: boolean;

  @Column({ type: 'boolean', default: false })
  has_education?: boolean;

  @Column({ type: 'boolean', default: false })
  has_products?: boolean;

  @Column({ type: 'uuid', nullable: true })
  template_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  color_palette_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  font_id?: string | null;

  @ManyToMany(() => Trade)
  @JoinTable({
    name: 'company_trades',
    joinColumn: { name: 'company_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'trade_id', referencedColumnName: 'id' },
  })
  trades: Trade[];

  @OneToMany(() => Trade, (trade) => trade.creator_company)
  owned_trades: Trade[];

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @PolymorphicRelation({ entity: Media, collection: 'company_logo', type: 'one' })
  logo?: Media;

  @OneToMany(() => Location, (location) => location.company, {
    onDelete: 'CASCADE',
  })
  locations: Location[];

  @OneToMany(() => CompanyService, (companyService) => companyService.company)
  companyServices?: CompanyService[];

  @OneToMany(() => CompanyAddOn, (companyAddOn) => companyAddOn.company)
  companyAddOns?: CompanyAddOn[];

  @OneToOne(() => CompanyAddress, (address) => address.company, {
    onDelete: 'CASCADE',
  })
  address?: CompanyAddress;

  @OneToOne(() => CompanyBooking, (booking) => booking.company, {
    cascade: true,
  })
  booking?: CompanyBooking;

  @OneToOne(() => CompanyRefundPolicy, (policy) => policy.company, {
    cascade: true,
  })
  refund_policy?: CompanyRefundPolicy;

  @OneToOne(() => CompanyDepositRequirement, (requirement) => requirement.company, {
    cascade: true,
  })
  deposit_requirement?: CompanyDepositRequirement;

  @OneToMany(() => CompanyPolicy, (policy) => policy.company)
  policies?: CompanyPolicy[];

  @OneToMany(() => CompanyPaymentMethod, (method) => method.company)
  company_payment_methods?: CompanyPaymentMethod[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  public async getLogo() {
    return await PolymorphicService.findOne(Media, this, 'company_logo');
  }
}
