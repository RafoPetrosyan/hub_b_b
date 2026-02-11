import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationVariable } from './notification-variable.entity';
import { NotificationTemplate } from './notification-template.entity';
import { CompanyNotificationTemplate } from './company-notification-template.entity';

@Entity({ name: 'notification_types' })
@Index(['key'], { unique: true })
export class NotificationType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToMany(() => NotificationVariable, (variable) => variable.types)
  @JoinTable({
    name: 'notification_type_variables',
    joinColumn: { name: 'notification_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'notification_variable_id', referencedColumnName: 'id' },
  })
  variables: NotificationVariable[];

  @OneToMany(() => NotificationTemplate, (template) => template.type)
  templates: NotificationTemplate[];

  @OneToMany(() => CompanyNotificationTemplate, (template) => template.type)
  company_templates: CompanyNotificationTemplate[];
}

