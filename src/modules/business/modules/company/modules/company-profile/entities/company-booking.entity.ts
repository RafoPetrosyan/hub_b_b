import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../../entities/company.entity';

@Entity('company_booking')
export class CompanyBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  company_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  subdomain?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  custom_subdomain?: string | null;

  @OneToOne(() => Company, (company) => company.booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
