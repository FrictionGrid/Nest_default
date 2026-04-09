import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';

@Injectable()
export class DashboardTeamService {
  constructor(
    @InjectRepository(TaskTeam)
    private readonly taskRepo: Repository<TaskTeam>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
  ) {}

  // ── Timeline calculation ─────────────────────────────────────────────────

  private calcTimeline(startDate: Date | null, endDate: Date | null): string {
    if (!startDate || !endDate) return 'just_started';
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const total = end - start;
    if (total <= 0) return 'overdue';
    const pct = ((now - start) / total) * 100;
    if (pct < 0) return 'just_started';
    if (pct < 20) return 'just_started';
    if (pct < 70) return 'normal';
    if (pct <= 100) return 'near_deadline';
    return 'overdue';
  }

  async getSummary() {
    const all = await this.taskRepo.find({ relations: ['project'] });
    const timelines = all.map((t) =>
      this.calcTimeline(t.project?.start_date ?? null, t.end_date ?? null),
    );
    return {
      total:         all.length,
      just_started:  timelines.filter((s) => s === 'just_started').length,
      normal:        timelines.filter((s) => s === 'normal').length,
      near_deadline: timelines.filter((s) => s === 'near_deadline').length,
      overdue:       timelines.filter((s) => s === 'overdue').length,
      completed:     all.filter((t) => t.status === 'completed').length,
    };
  }

  async getTasksThisMonth() {
    const rows = await this.taskRepo.find({
      relations: ['user', 'project'],
      order: { end_date: 'ASC' },
    });

    return rows.map((t) => ({
      id:           t.id,
      task_name:    t.task_name,
      member_name:  t.user?.display_name || t.user?.username || '—',
      project_name: (t.project as any)?.project_name || '—',
      status:       t.status,
      timeline:     this.calcTimeline(t.project?.start_date ?? null, t.end_date ?? null),
    }));
  }

  async getTeamProjects() {
    const rows = await this.projectTeamRepo.find({
      relations: ['team', 'project'],
      order: { id: 'ASC' },
    });
    return rows.map((pt) => ({
      team_name:    pt.team?.name             || '—',
      project_name: pt.project?.project_name || '—',
      project_id:   pt.project_id,
      sales_name:   pt.project?.sales_name   || '—',
      start_date:   pt.project?.start_date   || null,
      end_date:     pt.project?.end_date     || null,
      status:       pt.project?.status       || '—',
    }));
  }

  async completeTask(id: number) {
    await this.taskRepo.update(id, { status: 'completed' as any });
    return { ok: true };
  }
}
