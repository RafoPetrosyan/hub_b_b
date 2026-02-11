import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_tokens')
export class UserToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  token: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  type: string;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  expires_at: Date;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  is_revoked: boolean;

  @Column({ name: 'device_type', type: 'varchar', length: 50, nullable: true })
  device_type?: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;
}

