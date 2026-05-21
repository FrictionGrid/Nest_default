import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { ProjectType } from '../../database/entities/project_type.entity';
import { Team } from '../../database/entities/team.entity';

@Injectable()
export class SummaryYearService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(ProjectType)
    private readonly projectTypeRepo: Repository<ProjectType>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async getAvailableYears(): Promise<number[]> {
    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .select('DISTINCT EXTRACT(YEAR FROM p.created_at)::int', 'year')
      .orderBy('year', 'DESC')
      .getRawMany();

    const years = rows.map((r) => Number(r.year));
    const current = new Date().getFullYear();
    if (!years.includes(current)) years.unshift(current);
    return years;
  }

  async getSummary(year: number) {
    const result = await this.projectRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total_projects')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'completed')", 'completed')
      .addSelect("COUNT(*) FILTER (WHERE p.status != 'completed')", 'not_completed')
      .addSelect('COALESCE(SUM(p.po_value), 0)', 'total_po_value')
      .addSelect(
        "COALESCE(SUM(p.po_value) FILTER (WHERE p.status = 'completed'), 0)",
        'completed_po_value',
      )
      .addSelect(
        "COALESCE(SUM(p.po_value) FILTER (WHERE p.status != 'completed'), 0)",
        'remaining_po_value',
      )
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .getRawOne();

    return {
      total_projects: Number(result.total_projects),
      completed: Number(result.completed),
      not_completed: Number(result.not_completed),
      total_po_value: Number(result.total_po_value),
      completed_po_value: Number(result.completed_po_value),
      remaining_po_value: Number(result.remaining_po_value),
    };
  }

  async getTypeStats(year: number) {
    const rows = await this.projectTypeRepo
      .createQueryBuilder('pt')
      .innerJoin('project_incoming_type', 'pit', 'pit.type_id = pt.id')
      .innerJoin(
        'project_incoming',
        'p',
        'p.id = pit.project_id AND EXTRACT(YEAR FROM p.created_at) = :year',
        { year },
      )
      .select('pt.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pt.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
  }

  async getRegionStats(year: number) {
    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .select('p.region', 'region')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .andWhere('p.region IS NOT NULL')
      .andWhere("p.region != ''")
      .groupBy('p.region')
      .orderBy('count', 'DESC')
      .getRawMany();

    return rows.map((r) => ({ region: r.region, count: Number(r.count) }));
  }

  async getValueRangeStats(year: number) {
    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .select(
        `CASE
          WHEN p.po_value < 100000        THEN '< 100K'
          WHEN p.po_value < 1000000       THEN '100K–1M'
          WHEN p.po_value < 5000000       THEN '1M–5M'
          WHEN p.po_value < 10000000      THEN '5M–10M'
          ELSE '10M+'
        END`,
        'range_label',
      )
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .andWhere('p.po_value IS NOT NULL')
      .groupBy('range_label')
      .getRawMany();

    const order = ['< 100K', '100K–1M', '1M–5M', '5M–10M', '10M+'];
    const dataMap = new Map(rows.map((r) => [r.range_label, Number(r.count)]));
    return order.map((r) => ({ range: r, count: dataMap.get(r) ?? 0 }));
  }

  async getMonthlySummary(year: number) {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug',
      'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const rows = await this.projectRepo
      .createQueryBuilder('p')
      .select('EXTRACT(MONTH FROM p.created_at)', 'month_num')
      .addSelect('COUNT(*)', 'total')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'completed')", 'completed')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'in_progress')", 'in_progress')
      .addSelect("COUNT(*) FILTER (WHERE p.status = 'delayed')", 'delayed')
      .where('EXTRACT(YEAR FROM p.created_at) = :year', { year })
      .groupBy('month_num')
      .orderBy('month_num', 'ASC')
      .getRawMany();

    const dataMap = new Map(rows.map((r) => [Number(r.month_num), r]));

    return monthNames.map((name, i) => {
      const m = dataMap.get(i + 1);
      return {
        month: name,
        total: m ? Number(m.total) : 0,
        completed: m ? Number(m.completed) : 0,
        in_progress: m ? Number(m.in_progress) : 0,
        delayed: m ? Number(m.delayed) : 0,
      };
    });
  }

  async getTeamSummary(year: number) {
    const rows = await this.teamRepo
      .createQueryBuilder('t')
      .leftJoin(ProjectTeam, 'pt', 'pt.team_id = t.id')
      .leftJoin(
        ProjectIncoming,
        'p',
        'pt.project_id = p.id AND EXTRACT(YEAR FROM p.created_at) = :year',
        { year },
      )
      .select('t.name', 'team_name')
      .addSelect('COUNT(p.id)', 'total')
      .addSelect(
        "COUNT(p.id) FILTER (WHERE p.status = 'completed')",
        'completed',
      )
      .addSelect(
        "COUNT(p.id) FILTER (WHERE p.status != 'completed')",
        'not_completed',
      )
      .groupBy('t.id')
      .addGroupBy('t.name')
      .orderBy('t.id', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      team_name: r.team_name,
      total: Number(r.total),
      completed: Number(r.completed),
      not_completed: Number(r.not_completed),
    }));
  }
}
