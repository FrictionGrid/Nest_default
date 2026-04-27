import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { TaskTeam } from '../database/entities/task_team.entity';

const AVATAR_COLORS = [
  '#4A90E2', '#7B68EE', '#E45757', '#F4A62A',
  '#35B37E', '#14B8A6', '#9B59B6', '#E86F2A',
];

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(User)     private userRepo: Repository<User>,
    @InjectRepository(TaskTeam) private taskRepo: Repository<TaskTeam>,
  ) {}

  async getTimelineData(viewer?: { userId: number; role: string } | null) {
    const isHeadEngineer = viewer?.role === 'head_engineer';

    // หา team ของ head_engineer เพื่อกรอง
    let scopeTeamIds: number[] = [];
    if (isHeadEngineer) {
      const myTeams = await this.userRepo
        .createQueryBuilder('u')
        .leftJoin('user_teams', 'ut', 'ut.user_id = u.id')
        .select('ut.team_id', 'team_id')
        .where('u.id = :uid', { uid: viewer!.userId })
        .andWhere('ut.team_id IS NOT NULL')
        .getRawMany();
      scopeTeamIds = myTeams.map((r) => Number(r.team_id));
    }

    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin('user_teams', 'ut', 'ut.user_id = u.id')
      .leftJoin('team', 't', 't.id = ut.team_id')
      .select('u.id',            'id')
      .addSelect('u.display_name', 'display_name')
      .addSelect('u.username',     'username')
      .addSelect('u.role',         'role')
      .addSelect('t.id',           'team_id')
      .addSelect('t.name',         'team_name')
      .where("u.status = 'active'")
      .orderBy('u.id', 'ASC');

    if (isHeadEngineer && scopeTeamIds.length > 0) {
      qb.andWhere('ut.team_id IN (:...teamIds)', { teamIds: scopeTeamIds });
    } else if (isHeadEngineer && scopeTeamIds.length === 0) {
      qb.andWhere('1 = 0'); // ไม่มีทีม → ไม่เห็นใคร
    }

    const userRows = await qb.getRawMany();

    const seenUsers = new Set<number>();
    const users = userRows
      .filter((u) => { if (seenUsers.has(u.id)) return false; seenUsers.add(u.id); return true; })
      .map((u, i) => {
        const name   = u.display_name || u.username;
        const words  = name.trim().split(/\s+/);
        const initials = words.length >= 2
          ? (words[0][0] + words[1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase();
        return {
          id:       u.id,
          name,
          role:     u.team_name || u.role,
          teamId:   u.team_id ? Number(u.team_id) : null,
          initials,
          color:    AVATAR_COLORS[i % AVATAR_COLORS.length],
        };
      });

    // unique teams for dropdown
    const teamMap = new Map<number, string>();
    userRows.forEach((u) => {
      if (u.team_id) teamMap.set(Number(u.team_id), u.team_name);
    });
    const teams = Array.from(teamMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.id - b.id);

    const visibleUserIds = users.map((u) => u.id);

    const taskQb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoin('t.project', 'p')
      .select('t.id',                'id')
      .addSelect('t.user_id',         'userId')
      .addSelect('t.task_name',       'name')
      .addSelect('t.task_description','desc')
      .addSelect('t.start_date',      'start')
      .addSelect('t.end_date',        'end')
      .addSelect('t.status',          'dbStatus')
      .addSelect('p.project_name',    'project_name')
      .where('t.start_date IS NOT NULL')
      .andWhere('t.end_date IS NOT NULL')
      .orderBy('t.id', 'ASC');

    if (visibleUserIds.length > 0) {
      taskQb.andWhere('t.user_id IN (:...uids)', { uids: visibleUserIds });
    } else {
      taskQb.andWhere('1 = 0');
    }

    const taskRows = await taskQb.getRawMany();

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const tasks = taskRows.map((t) => {
      const endDate   = new Date(t.end);   endDate.setHours(0, 0, 0, 0);
      const startDate = new Date(t.start); startDate.setHours(0, 0, 0, 0);
      const daysLeft  = Math.round((endDate.getTime() - today.getTime()) / 86400000);

      let status: string;
      if (t.dbStatus === 'completed') {
        status = 'completed';
      } else if (t.dbStatus === 'problem' || daysLeft < 0) {
        status = 'overdue';
      } else if (daysLeft <= 3) {
        status = 'critical';
      } else if (daysLeft <= 7) {
        status = 'warning';
      } else {
        status = 'in_progress';
      }

      const totalMs   = endDate.getTime() - startDate.getTime();
      const elapsedMs = today.getTime()   - startDate.getTime();
      const progress  = totalMs > 0
        ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
        : 0;

      return {
        id:       t.id,
        userId:   Number(t.userId),
        name:     t.name,
        desc:     t.desc || '',
        start:    startDate.toISOString().split('T')[0],
        end:      endDate.toISOString().split('T')[0],
        status,
        progress,
      };
    });

    return { users, tasks, teams };
  }
}
