import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { ProjectIncoming } from './project_incoming.entity';

@Entity('project_type')
export class ProjectType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @ManyToMany(() => ProjectIncoming, (project) => project.types)
  projects: ProjectIncoming[];
}
