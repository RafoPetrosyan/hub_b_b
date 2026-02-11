import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mobile_versions' })
export class MobileVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  version: string;

  @Column({ type: 'timestamptz', name: 'release_at' })
  release_at: Date;

  @Column({ type: 'boolean', default: false, name: 'is_force' })
  is_force: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
