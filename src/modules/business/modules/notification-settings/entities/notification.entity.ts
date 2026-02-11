import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NotificationCategory } from './notification-category.entity';

@Entity({ name: 'notifications' })
@Index(['alias'], { unique: true })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NotificationCategory, (c) => c.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: NotificationCategory;

  @Column({ type: 'uuid', name: 'category_id' })
  category_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  // slug/alias used in code and queries (unique)
  @Column({ type: 'varchar', length: 150, unique: true })
  alias: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;
}
