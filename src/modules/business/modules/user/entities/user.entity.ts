import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { UserStatusEnum } from '../enum/user-status.enum';
import { Location } from '../../location/entities/location.entity';
import { Media } from '../../../../common/modules/media/media.entity';
import { PolymorphicService } from '../../../../../db/polymorph/polymorphic.service';
import { PolymorphicRelation } from '../../../../../db/polymorph/polymorphic.decorator';
import { Onboarding } from '../../onboarding/entities/onboarding.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  first_name: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  last_name: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    unique: false,
    default: null,
  })
  phone?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    name: 'password_hash',
  })
  password_hash: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'admin',
  })
  role: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  company_id?: string;

  @ManyToOne(() => Company, (business) => business.users, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  location_id?: string;

  @ManyToOne(() => Location, (location) => location.users, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @OneToMany(() => Onboarding, (onboarding) => onboarding.user, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  onboardings?: Onboarding[];

  @PolymorphicRelation({ entity: Media, collection: 'profile_picture', type: 'one' })
  profile_picture?: Media;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.INACTIVE,
  })
  status: UserStatusEnum;

  @Column({
    type: 'boolean',
    default: false,
  })
  tfa_mode: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  created_at: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'NOW()',
  })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  public async getProfilePicture() {
    return await PolymorphicService.findOne(Media, this);
  }
}
