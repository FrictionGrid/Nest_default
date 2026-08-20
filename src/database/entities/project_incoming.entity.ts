import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProjectMain } from './project_main.entity';

@Entity('project_incoming')
export class ProjectIncoming {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_main_id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  po_value: number;

  @Column({ length: 255, nullable: true })
  po_no: string;

  @ManyToOne(() => ProjectMain, (main) => main.pos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_main_id' })
  projectMain: ProjectMain;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
