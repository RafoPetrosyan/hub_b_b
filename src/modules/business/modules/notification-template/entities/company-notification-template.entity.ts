import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationTemplate } from './notification-template.entity';
import { NotificationProvider } from '../enum/notification-provider.enum';
import { NotificationType } from './notification-type.entity';

@Entity({ name: 'company_notification_templates' })
@Index(['company_id', 'base_template_id'], { unique: true })
@Index(['company_id', 'type'], { unique: true })
export class CompanyNotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  company_id: string;

  @ManyToOne(() => NotificationType)
  @JoinColumn({ name: 'type_id' })
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: NotificationProvider,
    default: NotificationProvider.EMAIL,
  })
  provider: NotificationProvider;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'uuid', name: 'base_template_id' })
  base_template_id: string;

  @ManyToOne(() => NotificationTemplate, (t) => t.company_templates, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'base_template_id' })
  base_template?: NotificationTemplate;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string | null;

  @Column({ type: 'timestamp', name: 'last_sync_date' })
  last_sync_date: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deleted_at?: Date | null;
}
