import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ProjectType } from './project_type.entity';

@Entity('project_incoming')
export class ProjectIncoming {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  item: number;

  @Column({ length: 255 })
  project_name: string;

  @Column({ length: 255, nullable: true })
  sales_name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  po_value: number;

  @Column({ length: 255, nullable: true })
  po_no: string;

  @Column({
    type: 'enum',
    enum: ['in_progress', 'delayed', 'completed'],
    enumName: 'project_status',
    default: 'in_progress',
  })
  status: 'in_progress' | 'delayed' | 'completed';

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @ManyToMany(() => ProjectType, (type) => type.projects, { eager: true })
  @JoinTable({
    name: 'project_incoming_type',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'type_id', referencedColumnName: 'id' },
  })
  types: ProjectType[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
