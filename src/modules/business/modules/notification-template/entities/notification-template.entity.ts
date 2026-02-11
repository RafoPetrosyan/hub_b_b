import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyNotificationTemplate } from './company-notification-template.entity';
import { NotificationProvider } from '../enum/notification-provider.enum';
import { NotificationType } from './notification-type.entity';

@Entity({ name: 'notification_templates' })
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  type_id: string;

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

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: true })
  created_by: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date | null;

  @OneToMany(
    () => CompanyNotificationTemplate,
    (ct) => ct.base_template,
  )
  company_templates: CompanyNotificationTemplate[];
}
