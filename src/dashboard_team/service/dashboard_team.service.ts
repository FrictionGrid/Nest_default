import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { UsersTeam } from '../../database/entities/users_team.entity';

@Injectable()
export class DashboardTeamService {
  constructor(
    @InjectRepository(TaskTeam)
    private readonly taskRepo: Repository<TaskTeam>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(UsersTeam)
    private readonly usersTeamRepo: Repository<UsersTeam>,
  ) {}

  private deadlineGroup(endDate: Date | null): 'general' | 'near' | 'urgent' | 'overdue' {
    if (!endDate) return 'general';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end   = new Date(endDate); end.setHours(0, 0, 0, 0);
    const diff  = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'overdue';
    if (diff <= 3) return 'urgent';
    if (diff <= 7) return 'near';
    return 'general';
  }

  async getSummary(userId: number) {
    const all        = await this.taskRepo.find({ where: { user_id: userId } });
    const incomplete = all.filter((t) => t.status !== 'completed');
    return {
      total:        incomplete.length,
      not_due:      incomplete.filter((t) => this.deadlineGroup(t.end_date) === 'general').length,
      general:      incomplete.filter((t) => this.deadlineGroup(t.end_date) === 'near').length,
      near:         incomplete.filter((t) => this.deadlineGroup(t.end_date) === 'urgent').length,
      overdue:      incomplete.filter((t) => this.deadlineGroup(t.end_date) === 'overdue').length,
    };
  }

  async getTasksThisMonth(userId: number) {
    const rows = await this.taskRepo.find({
      where: { user_id: userId },
      relations: ['user', 'project'],
      order: { end_date: 'ASC' },
    });

    const priorityOrder = { overdue: 0, urgent: 1, near: 2, general: 3 };
    const active = rows
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        const pa = priorityOrder[this.deadlineGroup(a.end_date ?? null)] ?? 4;
        const pb = priorityOrder[this.deadlineGroup(b.end_date ?? null)] ?? 4;
        return pa - pb;
      });
    const completed = rows.filter((t) => t.status === 'completed');
    const sorted    = [...active, ...completed];

    return sorted.map((t) => ({
      id:           t.id,
      task_name:    t.task_name,
      task_description: t.task_description,
      member_name:  t.user?.display_name || t.user?.username || '—',
      project_name: (t.project as any)?.project_name || '—',
      status:       t.status,
      end_date:     t.end_date ?? null,
      priority:     this.deadlineGroup(t.end_date ?? null),
    }));
  }

  async getTeamProjects(userId: number) {
    const userTeams = await this.usersTeamRepo.find({ where: { user_id: userId } });
    const teamIds = userTeams.map((ut) => ut.team_id);

    if (teamIds.length === 0) return [];

    const rows = await this.projectTeamRepo.find({
      where: teamIds.map((team_id) => ({ team_id })),
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

  async completeTask(id: number, description?: string) {
    await this.taskRepo.update(id, {
      status: 'completed' as any,
      ...(description ? { task_description: description } : {}),
    });
    return { ok: true };
  }

  async problemTask(id: number, description?: string) {
    await this.taskRepo.update(id, {
      status: 'problem' as any,
      ...(description ? { task_description: description } : {}),
    });
    return { ok: true };
  }
}
