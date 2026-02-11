import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Location } from './location.entity';

@Entity('location_working_hours')
@Index(['location_id', 'day'], { unique: true })
export class LocationWorkingHours {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'uuid',
    nullable: false,
  })
  location_id: string;

  @ManyToOne(() => Location, location => location.workingHours, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({
    type: 'enum',
    enum: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ],
  })
  day: string;

  @Column({ type: 'time' })
  open: string;

  @Column({ type: 'time' })
  close: string;

  @Column({ type: 'jsonb', default: [] })
  breaks: { start: string; end: string }[];
}
