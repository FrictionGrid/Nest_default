import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { ProjectIncoming } from './project_incoming.entity';

export type InstallmentStatus = 'paid' | 'pending' | 'upcoming';

@Entity('payment_installments')
export class PaymentInstallment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column()
  installment_no: number;

  @Column({ type: 'date', nullable: true })
  due_date: Date | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number | null;

  @Column({ type: 'varchar', length: 20, default: 'upcoming' })
  status: InstallmentStatus;

  @Column({ type: 'date', nullable: true })
  paid_date: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => ProjectIncoming, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectIncoming;
}
