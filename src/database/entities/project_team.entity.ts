import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectIncoming } from './project_incoming.entity';
import { Team } from './team.entity';

@Entity('project_team')
export class ProjectTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column()
  team_id: number;

  @ManyToOne(() => ProjectIncoming, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectIncoming;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
