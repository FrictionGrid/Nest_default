import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { ProjectMain } from './project_main.entity';

@Entity('project_type')
export class ProjectType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @ManyToMany(() => ProjectMain, (project) => project.types)
  projects: ProjectMain[];
}
