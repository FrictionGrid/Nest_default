import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { Team } from '../../database/entities/team.entity';
import { ProjectType } from '../../database/entities/project_type.entity';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { calcTaskProgress } from '../../common/utils/task-progress.util';

@Injectable()
export class OverviewProjectService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
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
      .select('COUNT(*)', 'total_projects')
      .addSelect('COALESCE(SUM(p.po_value), 0)', 'total_revenue')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'completed')", 'completed')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'delayed')", 'delayed')
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
    const projects = await this.projectRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.project_name', 'p.status'])
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .andWhere('p.po_value IS NOT NULL')
      .orderBy('p.po_value', 'DESC')
      .limit(12)
      .getMany();

    const projectIds = projects.map((p) => p.id);
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
      projects: projects.map((p) => ({
        id: p.id,
        project_name: p.project_name,
        status: p.status,
        progress: calcTaskProgress(tasksByProject.get(p.id) ?? []),
      })),
    };
  }

  async getRegionStats() {
    const regionLabels = [
      { key: 'bangkok', label: 'Bangkok' },
      { key: 'central', label: 'Central' },
      { key: 'north',   label: 'North'   },
      { key: 'east',    label: 'East'    },
      { key: 'west',    label: 'West'    },
      { key: 'south',   label: 'South'   },
    ];

    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .select('p.region', 'region')
      .addSelect('COUNT(*)', 'total')
      .where('p.region IS NOT NULL')
      .groupBy('p.region')
      .getRawMany();

    const dataMap = new Map(rows.map((r) => [r.region, Number(r.total)]));
    return regionLabels.map((r) => ({
      region: r.key,
      label: r.label,
      total: dataMap.get(r.key) ?? 0,
    }));
  }

  async getTypeStats() {
    const rows = await this.projectTypeRepo
      .createQueryBuilder('pt')
      .innerJoin('project_incoming_type', 'pit', 'pit.type_id = pt.id')
      .innerJoin('project_incoming', 'p', 'p.id = pit.project_id')
      .select('pt.name', 'name')
      .addSelect('COUNT(*)', 'total')
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
