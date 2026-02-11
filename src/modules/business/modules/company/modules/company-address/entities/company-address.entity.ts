import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Company } from '../../../entities/company.entity';

@Entity('company_address')
export class CompanyAddress {
  @PrimaryColumn({ name: 'company_id', type: 'uuid' })
  company_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  line1?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  line2?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state?: string;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postal_code?: string;

  @Column({ type: 'char', length: 2, nullable: true, default: 'US' })
  country?: string;

  @OneToOne(() => Company, (company) => company.address, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}

