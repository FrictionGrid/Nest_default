import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { Team } from '../../database/entities/team.entity';
import { UsersTeam } from '../../database/entities/users_team.entity';
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
    @InjectRepository(UsersTeam)
    private readonly userTeamRepo: Repository<UsersTeam>,
  ) {}

  private async getTeamIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.userTeamRepo.find({ where: { user_id: userId } });
    return rows.map((r) => r.team_id);
  }

  private mapRows(rows: ProjectTeam[]) {
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

  private async autoDelayProjects(rows: ProjectTeam[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDelay = rows.filter((r) => {
      const end = r.project?.end_date ? new Date(r.project.end_date) : null;
      if (end) end.setHours(0, 0, 0, 0);
      return end && end < today && r.project?.status === 'in_progress';
    });
    if (toDelay.length > 0) {
      await Promise.all(toDelay.map((r) => this.projectRepo.update(r.project_id, { status: 'delayed' })));
      toDelay.forEach((r) => { r.project.status = 'delayed'; });
    }
  }

  async findAll() {
    const rows = await this.projectTeamRepo.find({ relations: ['project', 'team'], order: { id: 'ASC' } });
    await this.autoDelayProjects(rows);
    return this.mapRows(rows);
  }

  async findAllScoped(userId: number) {
    const teamIds = await this.getTeamIdsByUser(userId);
    if (teamIds.length === 0) return [];
    const rows = await this.projectTeamRepo
      .createQueryBuilder('pt')
      .leftJoinAndSelect('pt.project', 'p')
      .leftJoinAndSelect('pt.team', 't')
      .where('pt.team_id IN (:...teamIds)', { teamIds })
      .orderBy('pt.id', 'ASC')
      .getMany();
    await this.autoDelayProjects(rows);
    return this.mapRows(rows);
  }

  findAllProjects() {
    return this.projectRepo.find({ order: { item: 'ASC', id: 'ASC' } });
  }

  async findProjectsScoped(userId: number) {
    const teamIds = await this.getTeamIdsByUser(userId);
    if (teamIds.length === 0) return [];
    const rows = await this.projectTeamRepo
      .createQueryBuilder('pt')
      .select('DISTINCT pt.project_id', 'project_id')
      .where('pt.team_id IN (:...teamIds)', { teamIds })
      .getRawMany();
    const projectIds = rows.map((r) => Number(r.project_id));
    if (projectIds.length === 0) return [];
    return this.projectRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...projectIds)', { projectIds })
      .orderBy('p.item', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getMany();
  }

  findAllTeams() {
    return this.teamRepo.find({ order: { id: 'ASC' } });
  }

  async findTeamsByUser(userId: number) {
    const teamIds = await this.getTeamIdsByUser(userId);
    if (teamIds.length === 0) return [];
    return this.teamRepo
      .createQueryBuilder('t')
      .where('t.id IN (:...teamIds)', { teamIds })
      .orderBy('t.id', 'ASC')
      .getMany();
  }

  async assertRowInUserTeam(id: number, userId: number): Promise<void> {
    const row = await this.projectTeamRepo.findOne({ where: { id } });
    if (!row) throw new ForbiddenException('Record not found');
    const teamIds = await this.getTeamIdsByUser(userId);
    if (!teamIds.includes(row.team_id)) throw new ForbiddenException('Access denied');
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
