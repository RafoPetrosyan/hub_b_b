import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum OnboardingTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
}

@Entity({ name: 'onboarding_tasks' })
export class OnboardingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  onboarding_id: string;

  @Column({ type: 'varchar', length: 200 })
  key: string; // e.g. 'create_company', 'setup_booking', 'activate_addons'

  @Column({ type: 'varchar', length: 50, enum: OnboardingTaskStatus, default: OnboardingTaskStatus.PENDING })
  status: OnboardingTaskStatus;

  @Column({ type: 'int', default: 0 })
  progress: number; // 0 - 100

  @Column({ type: 'jsonb', nullable: true })
  meta?: any | null;

  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
