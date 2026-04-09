import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { Team } from '../../database/entities/team.entity';
import { CreateManageProjectDto } from '../dto/create-manage_project.dto';
import { UpdateManageProjectDto } from '../dto/update-manage_project.dto';

@Injectable()
export class ManageProjectService {
  constructor(
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  async findAll() {
    const rows = await this.projectTeamRepo.find({
      relations: ['project', 'team'],
      order: { id: 'ASC' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // อัปเดต status → delayed ใน DB ถ้าเลย end_date และยังไม่ complete
    const toDelay = rows.filter((r) => {
      const end = r.project?.end_date ? new Date(r.project.end_date) : null;
      if (end) end.setHours(0, 0, 0, 0);
      return end && end < today && r.project?.status === 'in_progress';
    });

    if (toDelay.length > 0) {
      await Promise.all(
        toDelay.map((r) =>
          this.projectRepo.update(r.project_id, { status: 'delayed' }),
        ),
      );
      toDelay.forEach((r) => {
        r.project.status = 'delayed';
      });
    }

    return rows.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      team_id: r.team_id,
      project_name: r.project?.project_name,
      team_name: r.team?.name,
      start_date: r.project?.start_date,
      end_date: r.project?.end_date,
      status: r.project?.status,
    }));
  }

  findAllProjects() {
    return this.projectRepo.find({ order: { item: 'ASC', id: 'ASC' } });
  }

  findAllTeams() {
    return this.teamRepo.find({ order: { id: 'ASC' } });
  }

  async create(dto: CreateManageProjectDto) {
    const { start_date, end_date, ...teamData } = dto;
    const row = this.projectTeamRepo.create(teamData);
    const saved = await this.projectTeamRepo.save(row);

    if (start_date !== undefined || end_date !== undefined) {
      await this.projectRepo.update(dto.project_id, { start_date, end_date } as any);
    }

    return saved;
  }

  async update(id: number, dto: UpdateManageProjectDto) {
    const row = await this.projectTeamRepo.findOne({ where: { id } });
    if (!row) return null;

    const { start_date, end_date, ...teamData } = dto;

    if (teamData.project_id || teamData.team_id) {
      await this.projectTeamRepo.update(id, teamData);
    }

    const projectId = teamData.project_id ?? row.project_id;
    if (start_date !== undefined || end_date !== undefined) {
      await this.projectRepo.update(projectId, { start_date, end_date } as any);
    }

    return this.projectTeamRepo.findOne({ where: { id }, relations: ['project', 'team'] });
  }

  async complete(id: number) {
    const row = await this.projectTeamRepo.findOne({ where: { id } });
    if (!row) return null;
    await this.projectRepo.update(row.project_id, { status: 'completed' });
  }

  async remove(id: number) {
    await this.projectTeamRepo.delete(id);
  }
}
