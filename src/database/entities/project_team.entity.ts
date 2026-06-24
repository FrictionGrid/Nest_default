import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectIncoming } from './project_incoming.entity';
import { Team } from './team.entity';

export enum ProjectTeamStatus {
  IN_PROGRESS = 'in_progress',
  DELAYED = 'delayed',
  COMPLETED = 'completed',
}

@Entity('project_team')
export class ProjectTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column()
  team_id: number;

  @Column({
    type: 'enum',
    enum: ProjectTeamStatus,
    enumName: 'project_team_status',
    default: ProjectTeamStatus.IN_PROGRESS,
  })
  status: ProjectTeamStatus;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @ManyToOne(() => ProjectIncoming, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectIncoming;

  @ManyToOne(() => Team, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;
}
