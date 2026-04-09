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
  OVERDUE = 'overdue',
  NEAR_DEADLINE = 'near_deadline',
  HAS_TIME = 'has_time',
  JUST_STARTED = 'just_started',
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
  end_date: Date;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    enumName: 'task_status',
    default: TaskStatus.JUST_STARTED,
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
