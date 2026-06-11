import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum LogAction {
  LOGIN    = 'login',
  LOGOUT   = 'logout',
  CREATE   = 'create',
  UPDATE   = 'update',
  DELETE   = 'delete',
  UPLOAD   = 'upload',
  DOWNLOAD = 'download',
}

export enum LogStatus {
  SUCCESS = 'success',
  FAILED  = 'failed',
  WARNING = 'warning',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ nullable: true })
  user_id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50, nullable: true })
  user_role: string;

  @Column({ type: 'enum', enum: LogAction, enumName: 'log_action' })
  action: LogAction;

  @Column({ type: 'enum', enum: LogStatus, enumName: 'log_status', default: LogStatus.SUCCESS })
  status: LogStatus;

  @Column({ length: 100 })
  module: string;

  @Column({ nullable: true })
  target_id: number;

  @Column({ length: 500, nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
