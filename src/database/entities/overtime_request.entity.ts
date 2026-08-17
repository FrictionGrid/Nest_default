import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ProjectIncoming } from './project_incoming.entity';

export enum OvertimeType {
  WEEKDAY = 'weekday',
  HOLIDAY = 'holiday',
}

export enum OvertimeApprovalStatus {
  PENDING_LEVEL1 = 'pending_level1',
  PENDING_LEVEL2 = 'pending_level2',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('overtime_requests')
export class OvertimeRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  user_id: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'int', nullable: true })
  project_id: number | null;

  @ManyToOne(() => ProjectIncoming, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectIncoming | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_name: string | null;

  @Column({ type: 'date' })
  ot_date: Date;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  total_hours: number;

  @Column({ type: 'enum', enum: OvertimeType, enumName: 'ot_type' })
  ot_type: OvertimeType;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({
    type: 'enum',
    enum: OvertimeApprovalStatus,
    enumName: 'ot_approval_status',
    default: OvertimeApprovalStatus.PENDING_LEVEL1,
  })
  approval_status: OvertimeApprovalStatus;

  @Column({ type: 'timestamptz', nullable: true })
  supervisor_approved_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  manager_approved_at: Date | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;
}
