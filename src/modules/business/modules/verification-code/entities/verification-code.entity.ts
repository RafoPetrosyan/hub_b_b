import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  code: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  method: string; // 'email' or 'sms'

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  expires_at: Date;

  @Column({ name: 'is_used', type: 'boolean', default: false })
  is_used: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;
}

