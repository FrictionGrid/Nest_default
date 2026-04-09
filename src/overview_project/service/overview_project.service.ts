import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { Team } from '../../database/entities/team.entity';

@Injectable()
export class OverviewProjectService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async getSummary() {
    const result = await this.projectRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total_projects')
      .addSelect('COALESCE(SUM(p.po_value), 0)', 'total_revenue')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'completed')", 'completed')
      .addSelect("COUNT(*) FILTER (WHERE p.status != 'completed')", 'incomplete')
      .getRawOne();

    return {
      total_projects: Number(result.total_projects),
      total_revenue: Number(result.total_revenue),
      completed: Number(result.completed),
      incomplete: Number(result.incomplete),
    };
  }

  async getTeamStats() {
    const rows = await this.projectTeamRepo
      .createQueryBuilder('pt')
      .leftJoin('pt.team', 'team')
      .leftJoin('pt.project', 'project')
      .select('team.name', 'team_name')
      .addSelect('COUNT(pt.id)', 'total_projects')
      .addSelect("COUNT(pt.id) FILTER (WHERE project.status = 'completed')", 'completed')
      .addSelect("COUNT(pt.id) FILTER (WHERE project.status != 'completed')", 'incomplete')
      .groupBy('team.id')
      .addGroupBy('team.name')
      .orderBy('team.id', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      team_name: r.team_name,
      total_projects: Number(r.total_projects),
      completed: Number(r.completed),
      incomplete: Number(r.incomplete),
    }));
  }

  async getRecentProjects() {
    const rows = await this.projectTeamRepo
      .createQueryBuilder('pt')
      .leftJoin('pt.project', 'project')
      .leftJoin('pt.team', 'team')
      .select('project.id', 'id')
      .addSelect('project.project_name', 'project_name')
      .addSelect('project.sales_name', 'sales_name')
      .addSelect('project.status', 'status')
      .addSelect('project.created_at', 'date_in')
      .addSelect('team.name', 'team_name')
      .orderBy('project.created_at', 'DESC')
      .limit(7)
      .getRawMany();

    return rows;
  }

  async getMonthlySummary() {
    const year = new Date().getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April',
      'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December',
    ];

    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .select('EXTRACT(MONTH FROM p.created_at)', 'month_num')
      .addSelect('COUNT(*)', 'total_projects')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'completed')", 'completed')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .groupBy('month_num')
      .orderBy('month_num', 'ASC')
      .getRawMany();

    const dataMap = new Map(rows.map((r) => [Number(r.month_num), r]));

    return monthNames.map((name, i) => {
      const m = dataMap.get(i + 1);
      return {
        month_name: name,
        total_projects: m ? Number(m.total_projects) : null,
        completed: m ? Number(m.completed) : null,
      };
    });
  }
}
