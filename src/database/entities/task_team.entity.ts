import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ProjectIncoming } from './project_incoming.entity';

export enum TaskStatus {
  IN_PROGRESS = 'in_progress',
  PROBLEM = 'problem',
  COMPLETED = 'completed',
}

@Entity('task_team')
export class TaskTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  project_id: number;

  @Column({ length: 255 })
  task_name: string;

  @Column({ type: 'text', nullable: true })
  task_description: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
    default: TaskStatus.IN_PROGRESS,
  })
  status: TaskStatus;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ProjectIncoming, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectIncoming;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
