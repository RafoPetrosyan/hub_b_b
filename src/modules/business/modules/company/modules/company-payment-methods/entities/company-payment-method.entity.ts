import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../../entities/company.entity';
import { PaymentMethod } from '../../../../../../admin/modules/payment-methods/entities/payment-method.entity';

@Entity('company_payment_methods')
@Index(['company_id', 'payment_method_id'], { unique: true })
export class CompanyPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  company_id: string;

  @ManyToOne(() => Company, (company) => company.company_payment_methods, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ type: 'uuid', name: 'payment_method_id' })
  payment_method_id: string;

  @ManyToOne(() => PaymentMethod, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_method_id' })
  payment_method?: PaymentMethod;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: true })
  state: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
