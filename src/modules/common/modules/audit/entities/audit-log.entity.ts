import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  action: 'CREATE' | 'UPDATE' | 'DELETE';

  @Column({ type: 'varchar', length: 255 })
  entity_type: string;

  @Column({ type: 'text', nullable: true })
  entity_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  company_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  location_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  user_id?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  request_method?: string | null;

  @Column({ type: 'text', nullable: true })
  request_url?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  request_ip?: string | null;

  @Column({ type: 'text', nullable: true })
  request_user_agent?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  correlation_id?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  change_patch?: any | null;

  @Column({ type: 'jsonb', nullable: true })
  snapshot_before?: any | null;

  @Column({ type: 'jsonb', nullable: true })
  snapshot_after?: any | null;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
