import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersTeam } from '../../database/entities/users_team.entity';
import { User } from '../../database/entities/user.entity';
import { Team } from '../../database/entities/team.entity';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { CreateManageTeamDto } from '../dto/create-manage_team.dto';
import { UpdateManageTeamDto } from '../dto/update-manage_team.dto';

@Injectable()
export class ManageTeamService {
  constructor(
    @InjectRepository(UsersTeam)
    private readonly userTeamRepo: Repository<UsersTeam>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TaskTeam)
    private readonly taskRepo: Repository<TaskTeam>,
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
  ) {}

  private calcPriority(endDate: Date | null): string {
    if (!endDate) return 'general';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end   = new Date(endDate); end.setHours(0, 0, 0, 0);
    const diff  = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'overdue';
    if (diff <= 3) return 'urgent';
    if (diff <= 7) return 'near';
    return 'general';
  }

  // ── User-Team members ────────────────────────────────────────────────────

  async findAll() {
    const rows = await this.userTeamRepo.find({
      relations: ['user', 'team'],
      order: { id: 'ASC' },
    });
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      team_id: r.team_id,
      username: r.user?.username,
      display_name: r.user?.display_name,
      team_name: r.team?.name,
    }));
  }

  findAllUsers() {
    return this.userRepo.find({ order: { id: 'ASC' } });
  }

  findAllTeams() {
    return this.teamRepo.find({ order: { id: 'ASC' } });
  }

  create(dto: CreateManageTeamDto) {
    const row = this.userTeamRepo.create(dto);
    return this.userTeamRepo.save(row);
  }

  async update(id: number, dto: UpdateManageTeamDto) {
    await this.userTeamRepo.update(id, dto);
    return this.userTeamRepo.findOneBy({ id });
  }

  async remove(id: number) {
    await this.userTeamRepo.delete(id);
  }

  // ── Tasks ────────────────────────────────────────────────────────────────

  async findAllTasks() {
    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .leftJoin('t.project', 'p')
      .leftJoin('project_team', 'pt', 'pt.project_id = t.project_id')
      .leftJoin('team', 'tm', 'tm.id = pt.team_id')
      .select('t.id', 'id')
      .addSelect('t.user_id', 'user_id')
      .addSelect('t.project_id', 'project_id')
      .addSelect('t.task_name', 'task_name')
      .addSelect('t.task_description', 'task_description')
      .addSelect('t.end_date', 'end_date')
      .addSelect('t.status', 'status')
      .addSelect('u.username', 'username')
      .addSelect('u.display_name', 'display_name')
      .addSelect('p.project_name', 'project_name')
      .addSelect('tm.id', 'team_id')
      .addSelect('tm.name', 'team_name')
      .orderBy('t.id', 'ASC')
      .getRawMany();

    const seen = new Set<number>();
    return rows
      .filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
      .map((r) => ({
        id: r.id,
        user_id: r.user_id,
        project_id: r.project_id,
        task_name: r.task_name,
        task_description: r.task_description,
        end_date: r.end_date,
        status: r.status,
        priority: this.calcPriority(r.end_date ?? null),
        username: r.username,
        display_name: r.display_name,
        project_name: r.project_name,
        team_id: r.team_id,
        team_name: r.team_name,
      }));
  }

  // ── Scope helpers for head_engineer ─────────────────────────────────────

  async getTeamIdsByUser(userId: number): Promise<number[]> {
    const rows = await this.userTeamRepo.find({ where: { user_id: userId } });
    return rows.map((r) => r.team_id);
  }

  async getProjectIdsByTeams(teamIds: number[]): Promise<number[]> {
    if (teamIds.length === 0) return [];
    const rows = await this.projectTeamRepo
      .createQueryBuilder('pt')
      .where('pt.team_id IN (:...teamIds)', { teamIds })
      .getMany();
    return [...new Set(rows.map((r) => r.project_id))];
  }

  async findTasksScoped(userId: number) {
    const teamIds    = await this.getTeamIdsByUser(userId);
    const projectIds = await this.getProjectIdsByTeams(teamIds);
    if (projectIds.length === 0) return [];

    const rows = await this.taskRepo
      .createQueryBuilder('t')
      .leftJoin('t.user', 'u')
      .leftJoin('t.project', 'p')
      .leftJoin('project_team', 'pt', 'pt.project_id = t.project_id AND pt.team_id IN (:...teamIds)', { teamIds })
      .leftJoin('team', 'tm', 'tm.id = pt.team_id')
      .select('t.id', 'id')
      .addSelect('t.user_id', 'user_id')
      .addSelect('t.project_id', 'project_id')
      .addSelect('t.task_name', 'task_name')
      .addSelect('t.task_description', 'task_description')
      .addSelect('t.end_date', 'end_date')
      .addSelect('t.status', 'status')
      .addSelect('u.username', 'username')
      .addSelect('u.display_name', 'display_name')
      .addSelect('p.project_name', 'project_name')
      .addSelect('tm.id', 'team_id')
      .addSelect('tm.name', 'team_name')
      .where('t.project_id IN (:...projectIds)', { projectIds })
      .orderBy('t.id', 'ASC')
      .getRawMany();

    // deduplicate ในกรณี project อยู่หลาย team
    const seen = new Set<number>();
    return rows
      .filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; })
      .map((r) => ({
        id:               r.id,
        user_id:          r.user_id,
        project_id:       r.project_id,
        task_name:        r.task_name,
        task_description: r.task_description,
        end_date:         r.end_date,
        status:           r.status,
        priority:         this.calcPriority(r.end_date ?? null),
        username:         r.username,
        display_name:     r.display_name,
        project_name:     r.project_name,
        team_id:          r.team_id,
        team_name:        r.team_name,
      }));
  }

  async findTeamsByUser(userId: number) {
    const rows = await this.userTeamRepo.find({
      where: { user_id: userId },
      relations: ['team'],
    });
    return rows.map((r) => r.team).filter(Boolean);
  }

  async findUsersScoped(userId: number) {
    const teamIds = await this.getTeamIdsByUser(userId);
    if (teamIds.length === 0) return [];
    const rows = await this.userTeamRepo
      .createQueryBuilder('ut')
      .leftJoin('ut.user', 'u')
      .select(['ut.user_id', 'u.id', 'u.username', 'u.display_name'])
      .where('ut.team_id IN (:...teamIds)', { teamIds })
      .getRawMany();
    const seen = new Set<number>();
    return rows
      .filter((r) => { if (seen.has(r.u_id)) return false; seen.add(r.u_id); return true; })
      .map((r) => ({ id: r.u_id, username: r.u_username, display_name: r.u_display_name }));
  }

  async findProjectsScoped(userId: number) {
    const teamIds    = await this.getTeamIdsByUser(userId);
    const projectIds = await this.getProjectIdsByTeams(teamIds);
    if (projectIds.length === 0) return [];
    return this.projectRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...projectIds)', { projectIds })
      .orderBy('p.item', 'ASC')
      .addOrderBy('p.id', 'ASC')
      .getMany();
  }

  async assertTaskInUserTeam(taskId: number, userId: number): Promise<void> {
    const task = await this.taskRepo.findOneBy({ id: taskId });
    if (!task) throw new ForbiddenException('Task not found');
    const projectIds = await this.getProjectIdsByTeams(await this.getTeamIdsByUser(userId));
    if (!projectIds.includes(task.project_id)) {
      throw new ForbiddenException('Access denied: task not in your team');
    }
  }

  async assertProjectInUserTeam(projectId: number, userId: number): Promise<void> {
    const projectIds = await this.getProjectIdsByTeams(await this.getTeamIdsByUser(userId));
    if (!projectIds.includes(projectId)) {
      throw new ForbiddenException('Access denied: project not in your team');
    }
  }

  // ── Projects ─────────────────────────────────────────────────────────────

  findAllProjects() {
    return this.projectRepo.find({ order: { item: 'ASC', id: 'ASC' } });
  }

  async createTask(dto: any) {
    const task = this.taskRepo.create(dto);
    return this.taskRepo.save(task);
  }

  async updateTask(id: number, dto: any) {
    await this.taskRepo.update(id, dto);
    return this.taskRepo.findOneBy({ id });
  }

  async removeTask(id: number) {
    await this.taskRepo.delete(id);
  }
}
