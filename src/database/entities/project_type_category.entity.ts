import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectType } from './project_type.entity';

@Entity('project_type_categories')
export class ProjectTypeCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_type_id: number;

  @Column({ length: 50 })
  category: string;

  @ManyToOne(() => ProjectType, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_type_id' })
  projectType: ProjectType;
}
