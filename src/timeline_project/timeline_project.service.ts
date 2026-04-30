import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from '../database/entities/team.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

const AVATAR_COLORS = [
  '#4A90E2', '#7B68EE', '#E45757', '#F4A62A',
  '#35B37E', '#14B8A6', '#9B59B6', '#E86F2A',
];

@Injectable()
export class TimelineProjectService {
  constructor(
    @InjectRepository(Team)         private teamRepo: Repository<Team>,
    @InjectRepository(ProjectTeam)  private projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(UsersTeam)    private userTeamRepo: Repository<UsersTeam>,
  ) {}

  async getTimelineData(viewer?: { userId: number; role: string } | null) {
    const isHeadEngineer = viewer?.role === 'head_engineer';

    let scopeTeamIds: number[] = [];
    if (isHeadEngineer) {
      const rows = await this.userTeamRepo.find({ where: { user_id: viewer!.userId } });
      scopeTeamIds = rows.map((r) => r.team_id);
      if (scopeTeamIds.length === 0) return { teams: [], projects: [] };
    }

    const teamQb = this.teamRepo.createQueryBuilder('t').orderBy('t.id', 'ASC');
    if (isHeadEngineer) {
      teamQb.where('t.id IN (:...teamIds)', { teamIds: scopeTeamIds });
    }
    const teamRows = await teamQb.getMany();

    const teams = teamRows.map((t, i) => {
      const words    = t.name.trim().split(/\s+/);
      const initials = words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : t.name.slice(0, 2).toUpperCase();
      return { id: t.id, name: t.name, initials, color: AVATAR_COLORS[i % AVATAR_COLORS.length] };
    });

    const teamIds = teams.map((t) => t.id);
    if (teamIds.length === 0) return { teams: [], projects: [] };

    const rows = await this.projectTeamRepo
      .createQueryBuilder('pt')
      .leftJoin('pt.project', 'p')
      .select('pt.id',             'id')
      .addSelect('pt.team_id',     'teamId')
      .addSelect('p.project_name', 'name')
      .addSelect('p.start_date',   'start')
      .addSelect('p.end_date',     'end')
      .addSelect('p.status',       'status')
      .where('pt.team_id IN (:...teamIds)', { teamIds })
      .orderBy('pt.id', 'ASC')
      .getRawMany();

    const projects = rows
      .filter((r) => r.start && r.end)
      .map((r) => ({
        id:     r.id,
        teamId: Number(r.teamId),
        name:   r.name   || '(no name)',
        start:  new Date(r.start).toISOString().split('T')[0],
        end:    new Date(r.end).toISOString().split('T')[0],
        status: r.status || 'in_progress',
      }));

    return { teams, projects };
  }
}
