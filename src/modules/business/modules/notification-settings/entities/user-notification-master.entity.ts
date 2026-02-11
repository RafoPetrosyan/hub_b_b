import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum DigestFrequency {
  OFF = 'off',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export type QuietHour = { day: string; start: string; end: string };

@Entity({ name: 'user_notification_masters' })
export class UserNotificationMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Index()
  user_id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  // global digest frequency
  @Column({
    type: 'enum',
    enum: DigestFrequency,
    default: DigestFrequency.OFF,
  })
  digest_frequency: DigestFrequency;

  /**
   * quiet_hours stored as jsonb:
   * [
   *   { day: "monday", start: "22:00", end: "07:00" },
   *   ...
   * ]
   */
  @Column({ type: 'jsonb', nullable: true })
  quiet_hours?: QuietHour[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
