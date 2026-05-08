import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { User } from '../../database/entities/user.entity';

const TASK_WEIGHTS: Record<string, number> = {
  'PO/Quotation':            0,
  'Wiring Diagram':         10,
  'Graphic 3D':             20,
  'Controller I/O':         10,
  'FAT & SAT':              10,
  'Programming/GUI':        30,
  'Testing & Commissioning':15,
  'Handover Doc':            5,
  'Defect list':            10,
  'Other':                   5,
};

const PROG_MULTIPLIERS: Record<string, number> = {
  'BMS':  1.6,
  'EPO':  1.6,
  'PME':  1.3,
  'ACS':  1.2,
  'CCTV': 1.0,
};

const BASE = 5000;

function calcLoad(taskType: string | null, remainingDays: number, projectTypes: string[]): number {
  const weight = TASK_WEIGHTS[taskType ?? ''] ?? 0;
  if (taskType === 'Programming/GUI' && projectTypes.length > 0) {
    const multiplier = Math.max(...projectTypes.map(n => PROG_MULTIPLIERS[n] ?? 1.0));
    return weight * remainingDays * multiplier;
  }
  return weight * remainingDays;
}

function loadColor(pct: number): string {
  if (pct <= 50)  return 'green';
  if (pct <= 80)  return 'yellow';
  if (pct <= 100) return 'orange';
  return 'red';
}

function remainingDays(endDate: Date, today: Date): number {
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);
  return Math.max(Math.round((end.getTime() - today.getTime()) / 86400000), 0);
}

@Injectable()
export class WorkloadService {
  constructor(
    @InjectRepository(TaskTeam) private readonly taskRepo: Repository<TaskTeam>,
    @InjectRepository(User)     private readonly userRepo: Repository<User>,
  ) {}

  private async getActiveTasks(userId?: number) {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const qb = this.taskRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.user', 'u')
      .leftJoinAndSelect('t.project', 'p')
      .leftJoinAndSelect('p.types', 'pt')
      .where("t.status != 'completed'")
      .andWhere('t.start_date <= :today', { today })
      .andWhere('t.end_date >= :today', { today });

    if (userId) qb.andWhere('t.user_id = :userId', { userId });

    return { tasks: await qb.getMany(), today };
  }

  async getUserWorkloads() {
    const { tasks, today } = await this.getActiveTasks();
    const users = await this.userRepo.find({ where: { status: 'active' }, order: { display_name: 'ASC' } });

    const map = new Map<number, { name: string; load: number; active: number; in_progress: number; problem: number }>();
    users.forEach(u => map.set(u.id, {
      name: u.display_name || u.username,
      load: 0, active: 0, in_progress: 0, problem: 0,
    }));

    tasks.forEach(t => {
      const entry = map.get(t.user_id);
      if (!entry) return;
      const days = remainingDays(t.end_date, today);
      const types = (t.project?.types ?? []).map((pt: any) => pt.name);
      entry.load    += calcLoad(t.task_type, days, types);
      entry.active  += 1;
      if (t.status === 'in_progress') entry.in_progress++;
      else if (t.status === 'problem') entry.problem++;
    });

    return users.map(u => {
      const e   = map.get(u.id)!;
      const pct = Math.round((e.load / BASE) * 100);
      return { id: u.id, name: e.name, pct, color: loadColor(pct), active: e.active, in_progress: e.in_progress, problem: e.problem };
    });
  }

  async getUserDetail(userId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) return null;

    const { tasks, today } = await this.getActiveTasks(userId);

    let totalLoad = 0;
    const taskRows = tasks.map(t => {
      const days  = remainingDays(t.end_date, today);
      const types = (t.project?.types ?? []).map((pt: any) => pt.name);
      const load  = Math.round(calcLoad(t.task_type, days, types));
      totalLoad  += load;
      return {
        id:           t.id,
        task_name:    t.task_name,
        task_type:    t.task_type,
        project_id:   t.project_id,
        project_name: t.project?.project_name ?? '—',
        project_types: types.join(', ') || '—',
        start_date:   t.start_date,
        end_date:     t.end_date,
        remaining_days: days,
        status:       t.status,
        load,
        load_pct:     Math.round((load / BASE) * 1000) / 10,
      };
    }).sort((a, b) => b.load - a.load);

    const pct = Math.round((totalLoad / BASE) * 100);
    return {
      user:       { id: user.id, name: user.display_name || user.username },
      pct,
      color:      loadColor(pct),
      total_load: Math.round(totalLoad),
      tasks:      taskRows,
    };
  }
}
