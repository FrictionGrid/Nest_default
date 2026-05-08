import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { TaskTeam } from '../database/entities/task_team.entity';

const TASK_TYPE_WEIGHTS: Record<string, number> = {
  'PO/Quotation':             0,
  'Wiring Diagram':          10,
  'Graphic 3D':              20,
  'Controller I/O':          10,
  'FAT & SAT':               10,
  'Programming/GUI':         30,
  'Testing & Commissioning': 15,
  'Handover Doc':             5,
  'Defect list':              0,
  'Other':                    0,
};

function calcTaskProgress(tasks: TaskTeam[]): number {
  if (tasks.length === 0) return 0;

  const groups: Record<string, TaskTeam[]> = {};
  for (const task of tasks) {
    const type = task.task_type || 'Other';
    if ((TASK_TYPE_WEIGHTS[type] ?? 0) === 0) continue;
    if (!groups[type]) groups[type] = [];
    groups[type].push(task);
  }

  let totalWeight = 0;
  for (const type of Object.keys(groups)) {
    totalWeight += TASK_TYPE_WEIGHTS[type]!;
  }
  if (totalWeight === 0) return 0;

  let overall = 0;
  for (const [type, typeTasks] of Object.entries(groups)) {
    const normalizedWeight = (TASK_TYPE_WEIGHTS[type]! / totalWeight) * 100;
    const perTaskWeight = normalizedWeight / typeTasks.length;
    for (const task of typeTasks) {
      const pct = task.status === 'completed' ? 100 : task.progress;
      overall += (pct / 100) * perTaskWeight;
    }
  }

  return Math.round(overall);
}

@Injectable()
export class DetailProjectService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(TaskTeam)
    private readonly taskRepo: Repository<TaskTeam>,
  ) {}

  async findById(id: number) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['types'],
    });
    if (!project) throw new NotFoundException('Project not found');

    const projectTeams = await this.projectTeamRepo.find({
      where: { project_id: id },
      relations: ['team'],
    });

    const tasks = await this.taskRepo.find({
      where: { project_id: id },
      relations: ['user'],
      order: { id: 'ASC' },
    });

    const name = project.project_name || '';
    const avatarText = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase() || '?';

    function fmtDate(d: Date | null) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    }

    const statusMap = {
      in_progress: { label: 'In Progress', cls: 'b-processing' },
      delayed:     { label: 'Delayed',     cls: 'b-blocked'    },
      completed:   { label: 'Completed',   cls: 'b-completed'  },
    };
    const statusInfo = statusMap[project.status] ?? { label: project.status, cls: 'b-pending' };

    const taskStatusMap = {
      in_progress: { label: 'In Progress', cls: 'ts-inprogress' },
      completed:   { label: 'Completed',   cls: 'ts-completed'  },
      problem:     { label: 'Problem',     cls: 'ts-problem'    },
    };

    return {
      project: {
        id:          project.id,
        avatarText,
        projectName: project.project_name,
        item:        project.item ?? '—',
        dateIn:      fmtDate(project.start_date),
        endDate:     fmtDate(project.end_date),
        salesName:   project.sales_name || '—',
        poValue:     project.po_value
          ? '฿' + Number(project.po_value).toLocaleString('en-US', { minimumFractionDigits: 2 })
          : '—',
        poNo:        project.po_no || '—',
        status:      project.status,
        statusLabel: statusInfo.label,
        statusCls:   statusInfo.cls,
        types:       project.types?.map((t) => t.name) ?? [],
      },
      teams: projectTeams.map((pt) => ({
        id:        pt.id,
        team_id:   pt.team_id,
        team_name: pt.team?.name ?? '—',
      })),
      tasks: tasks.map((t) => {
        const si = taskStatusMap[t.status] ?? { label: t.status, cls: '' };
        return {
          id:               t.id,
          task_name:        t.task_name,
          task_description: t.task_description,
          task_type:        t.task_type,
          progress:         t.progress,
          end_date:         fmtDate(t.end_date),
          status:           t.status,
          statusLabel:      si.label,
          statusCls:        si.cls,
          user_name:        t.user?.display_name || t.user?.username || '—',
        };
      }),
      taskProgress: calcTaskProgress(tasks),
    };
  }
}
