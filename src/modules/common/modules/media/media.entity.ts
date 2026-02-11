import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  filename: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  file_path: string;

  @Column({ type: 'varchar', length: 1024 })
  url: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  owner_type?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  owner_id?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  uploaded_by?: string;

  @Column({ type: 'varchar', length: 200, default: 'default' })
  collection!: string;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata_json: any;

  @Column({ type: 'varchar', length: 50 })
  file_format: string;

  @Column({ type: 'float', default: 0 })
  file_size_kb: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  created_at: Date;
}
