import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { TaskTeam } from '../database/entities/task_team.entity';

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
          end_date:         fmtDate(t.end_date),
          status:           t.status,
          statusLabel:      si.label,
          statusCls:        si.cls,
          user_name:        t.user?.display_name || t.user?.username || '—',
        };
      }),
    };
  }
}
