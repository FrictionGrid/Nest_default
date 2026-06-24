import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTeam, ProjectTeamStatus } from '../../database/entities/project_team.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { Team } from '../../database/entities/team.entity';
import { UsersTeam } from '../../database/entities/users_team.entity';
import { CreateManageProjectDto } from '../dto/create-manage_project.dto';
import { UpdateManageProjectDto } from '../dto/update-manage_project.dto';
import { ActivityLogService } from '../../activity_log/service/activity_log.service';

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
    private readonly logService: ActivityLogService,
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
      start_date: r.start_date,
      end_date: r.end_date,
      status: r.status,
      created_at: r.project?.created_at,
    }));
  }

  private async autoDelayProjects(rows: ProjectTeam[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const toDelay = rows.filter((r) => {
      const end = r.end_date ? new Date(r.end_date) : null;
      if (end) end.setHours(0, 0, 0, 0);
      return end && end < today && r.status === ProjectTeamStatus.IN_PROGRESS;
    });
    if (toDelay.length > 0) {
      await Promise.all(toDelay.map((r) => this.projectTeamRepo.update(r.id, { status: ProjectTeamStatus.DELAYED })));
      toDelay.forEach((r) => { r.status = ProjectTeamStatus.DELAYED; });
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

  async create(dto: CreateManageProjectDto, userId?: number, userRole?: string) {
    const { start_date, end_date, status, ...teamData } = dto;
    const row = this.projectTeamRepo.create({
      project_id: teamData.project_id,
      team_id: teamData.team_id,
      start_date: start_date as any,
      end_date: end_date as any,
      ...(status ? { status: status as ProjectTeamStatus } : {}),
    });
    const saved = await this.projectTeamRepo.save(row);
    await this.logService.logProject('create', saved.id, { userId, userRole });
    return saved;
  }

  async update(id: number, dto: UpdateManageProjectDto, userId?: number, userRole?: string) {
    const row = await this.projectTeamRepo.findOne({ where: { id } });
    if (!row) return null;
    const { start_date, end_date, status, ...teamData } = dto;
    const updateData: Partial<ProjectTeam> = {};
    if (teamData.project_id !== undefined) updateData.project_id = teamData.project_id;
    if (teamData.team_id !== undefined) updateData.team_id = teamData.team_id;
    if (start_date !== undefined) updateData.start_date = start_date as any;
    if (end_date !== undefined) updateData.end_date = end_date as any;
    if (status !== undefined) updateData.status = status as ProjectTeamStatus;
    await this.projectTeamRepo.update(id, updateData);
    await this.logService.logProject('update', id, { userId, userRole });
    return this.projectTeamRepo.findOne({ where: { id }, relations: ['project', 'team'] });
  }

  async complete(id: number, userId?: number, userRole?: string) {
    const row = await this.projectTeamRepo.findOne({ where: { id } });
    if (!row) return null;
    await this.projectTeamRepo.update(id, { status: ProjectTeamStatus.COMPLETED });
    await this.logService.logProject('complete', id, { userId, userRole });
  }

  async remove(id: number, userId?: number, userRole?: string) {
    await this.logService.logProject('delete', id, { userId, userRole });
    await this.projectTeamRepo.delete(id);
  }
}
