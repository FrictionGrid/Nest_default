import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectMain } from '../../database/entities/project_main.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { Team } from '../../database/entities/team.entity';
import { ProjectType } from '../../database/entities/project_type.entity';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { calcTaskProgress } from '../../common/utils/task-progress.util';

@Injectable()
export class OverviewProjectService {
  constructor(
    @InjectRepository(ProjectMain)
    private readonly projectRepo: Repository<ProjectMain>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(ProjectType)
    private readonly projectTypeRepo: Repository<ProjectType>,
    @InjectRepository(TaskTeam)
    private readonly taskTeamRepo: Repository<TaskTeam>,
  ) {}

  async getSummary() {
    const year = new Date().getFullYear();
    const result = await this.projectRepo
      .createQueryBuilder('p')
      .leftJoin('project_incoming', 'po', 'po.project_main_id = p.id')
      .select('COUNT(DISTINCT p.id)', 'total_projects')
      .addSelect('COALESCE(SUM(po.po_value), 0)', 'total_revenue')
      .addSelect("COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed')", 'completed')
      .addSelect("COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'delayed')", 'delayed')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .getRawOne();

    return {
      total_projects: Number(result.total_projects),
      total_revenue: Number(result.total_revenue),
      completed: Number(result.completed),
      delayed: Number(result.delayed),
      year,
    };
  }

  async getTeamStats(range: string = 'all') {
    let qb = this.projectTeamRepo
      .createQueryBuilder('pt')
      .leftJoin('pt.team', 'team')
      .leftJoin('pt.project', 'project')
      .select('team.name', 'team_name')
      .addSelect('COUNT(pt.id)', 'total_projects')
      .addSelect("COUNT(pt.id) FILTER (WHERE pt.status = 'in_progress')", 'in_progress')
      .addSelect("COUNT(pt.id) FILTER (WHERE pt.status = 'completed')", 'completed')
      .addSelect("COUNT(pt.id) FILTER (WHERE pt.status = 'delayed')", 'delayed')
      .groupBy('team.id')
      .addGroupBy('team.name')
      .orderBy('team.id', 'ASC');

    if (range === 'year') {
      const year = new Date().getFullYear();
      qb = qb.andWhere('EXTRACT(YEAR FROM project.created_at) = :year', { year });
    } else if (range !== 'all') {
      const months = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[range] ?? 0;
      if (months > 0) {
        const minDate = new Date();
        minDate.setMonth(minDate.getMonth() - months);
        const now = new Date();
        qb = qb.andWhere('project.created_at >= :minDate AND project.created_at <= :now', { minDate, now });
      }
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      team_name: r.team_name,
      total_projects: Number(r.total_projects),
      in_progress: Number(r.in_progress),
      completed: Number(r.completed),
      delayed: Number(r.delayed),
    }));
  }

  async getTopValueProjects() {
    const year = new Date().getFullYear();
    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .innerJoin('project_incoming', 'po', 'po.project_main_id = p.id')
      .select('p.id', 'id')
      .addSelect('p.project_name', 'project_name')
      .addSelect('p.status', 'status')
      .addSelect('SUM(po.po_value)', 'total_value')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .groupBy('p.id')
      .addGroupBy('p.project_name')
      .addGroupBy('p.status')
      .orderBy('total_value', 'DESC')
      .limit(12)
      .getRawMany();

    const projectIds = rows.map((r) => Number(r.id));
    const allTasks = projectIds.length
      ? await this.taskTeamRepo
          .createQueryBuilder('t')
          .select(['t.project_id', 't.task_type', 't.progress', 't.status'])
          .where('t.project_id IN (:...ids)', { ids: projectIds })
          .getMany()
      : [];

    const tasksByProject = new Map<number, typeof allTasks>();
    for (const t of allTasks) {
      if (!tasksByProject.has(t.project_id)) tasksByProject.set(t.project_id, []);
      tasksByProject.get(t.project_id)!.push(t);
    }

    return {
      year,
      projects: rows.map((r) => ({
        id: Number(r.id),
        project_name: r.project_name,
        status: r.status,
        progress: calcTaskProgress(tasksByProject.get(Number(r.id)) ?? []),
      })),
    };
  }

  async getTypeStats() {
    const year = new Date().getFullYear();
    const rows = await this.projectTypeRepo
      .createQueryBuilder('pt')
      .innerJoin('project_main_type', 'pmt', 'pmt.type_id = pt.id')
      .innerJoin('project_main', 'p', 'p.id = pmt.project_main_id')
      .select('pt.name', 'name')
      .addSelect('COUNT(*)', 'total')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .groupBy('pt.name')
      .orderBy('total', 'DESC')
      .getRawMany();

    return rows.map((r) => ({ label: r.name, total: Number(r.total) }));
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
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'in_progress')", 'in_progress')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'completed')", 'completed')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'delayed')", 'delayed')
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
        in_progress: m ? Number(m.in_progress) : null,
        completed: m ? Number(m.completed) : null,
        delayed: m ? Number(m.delayed) : null,
      };
    });
  }
}
