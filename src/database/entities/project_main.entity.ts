import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { ProjectType } from './project_type.entity';
import { ProjectIncoming } from './project_incoming.entity';

@Entity('project_main')
export class ProjectMain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', nullable: true })
  item: number;

  @Column({ length: 255 })
  project_name: string;

  @Column({ length: 255, nullable: true })
  sales_name: string;

  @Column({
    type: 'enum',
    enum: ['in_progress', 'delayed', 'completed'],
    enumName: 'project_status',
    default: 'in_progress',
  })
  status: 'in_progress' | 'delayed' | 'completed';

  @ManyToMany(() => ProjectType, (type) => type.projects, { eager: true })
  @JoinTable({
    name: 'project_main_type',
    joinColumn: { name: 'project_main_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'type_id', referencedColumnName: 'id' },
  })
  types: ProjectType[];

  @OneToMany(() => ProjectIncoming, (po) => po.projectMain, { cascade: true })
  pos: ProjectIncoming[];

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
