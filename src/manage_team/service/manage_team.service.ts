import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { ActivityLogService } from '../../activity_log/service/activity_log.service';
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
    private readonly logService: ActivityLogService,
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

  async findAllUsers() {
    return this.getUsersWithTeams();
  }

  private async getUsersWithTeams(userIds?: number[]) {
    let qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin('user_teams', 'ut', 'ut.user_id = u.id')
      .leftJoin('team', 'tm', 'tm.id = ut.team_id')
      .select('u.id', 'uid')
      .addSelect('u.username', 'username')
      .addSelect('u.display_name', 'display_name')
      .addSelect('tm.name', 'team_name')
      .orderBy('u.id', 'ASC');
    if (userIds && userIds.length > 0) {
      qb = qb.where('u.id IN (:...ids)', { ids: userIds });
    }
    const rows = await qb.getRawMany();
    const map = new Map<number, { id: number; username: string; display_name: string; teams: string[] }>();
    for (const r of rows) {
      if (!map.has(r.uid)) map.set(r.uid, { id: r.uid, username: r.username, display_name: r.display_name, teams: [] });
      if (r.team_name) map.get(r.uid)!.teams.push(r.team_name);
    }
    return Array.from(map.values());
  }

  findAllTeams() {
    return this.teamRepo.find({ order: { id: 'ASC' } });
  }

  async getCurrentUserTeams(userId: number): Promise<string[]> {
    const rows = await this.userTeamRepo
      .createQueryBuilder('ut')
      .leftJoin('team', 'tm', 'tm.id = ut.team_id')
      .select('tm.name', 'team_name')
      .where('ut.user_id = :userId', { userId })
      .getRawMany();
    return rows.map((r) => r.team_name).filter(Boolean);
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
      .leftJoin('user_teams', 'ut', 'ut.user_id = t.user_id')
      .leftJoin('team', 'tm', 'tm.id = ut.team_id')
      .select('t.id', 'id')
      .addSelect('t.user_id', 'user_id')
      .addSelect('t.project_id', 'project_id')
      .addSelect('t.task_name', 'task_name')
      .addSelect('t.task_description', 'task_description')
      .addSelect('t.start_date', 'start_date')
      .addSelect('t.end_date', 'end_date')
      .addSelect('t.status', 'status')
      .addSelect('t.task_type', 'task_type')
      .addSelect('t.task_comment', 'task_comment')
      .addSelect('t.replanned_start', 'replanned_start')
      .addSelect('t.replanned_end',   'replanned_end')
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
        start_date: r.start_date,
        end_date: r.end_date,
        replanned_start: r.replanned_start,
        replanned_end: r.replanned_end,
        status: r.status,
        task_type: r.task_type,
        task_comment: r.task_comment,
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
      .leftJoin('user_teams', 'ut', 'ut.user_id = t.user_id')
      .leftJoin('team', 'tm', 'tm.id = ut.team_id')
      .select('t.id', 'id')
      .addSelect('t.user_id', 'user_id')
      .addSelect('t.project_id', 'project_id')
      .addSelect('t.task_name', 'task_name')
      .addSelect('t.task_description', 'task_description')
      .addSelect('t.start_date', 'start_date')
      .addSelect('t.end_date', 'end_date')
      .addSelect('t.status', 'status')
      .addSelect('t.task_type', 'task_type')
      .addSelect('t.task_comment', 'task_comment')
      .addSelect('t.replanned_start', 'replanned_start')
      .addSelect('t.replanned_end',   'replanned_end')
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
        start_date:       r.start_date,
        end_date:         r.end_date,
        replanned_start:  r.replanned_start,
        replanned_end:    r.replanned_end,
        status:           r.status,
        task_type:        r.task_type,
        task_comment:     r.task_comment,
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
    const scopedRows = await this.userTeamRepo
      .createQueryBuilder('ut')
      .select('DISTINCT ut.user_id', 'uid')
      .where('ut.team_id IN (:...teamIds)', { teamIds })
      .getRawMany();
    const userIds = scopedRows.map((r) => Number(r.uid));
    if (userIds.length === 0) return [];
    return this.getUsersWithTeams(userIds);
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

  async createTask(dto: any, userId?: number, userRole?: string) {
    const task  = this.taskRepo.create(dto as DeepPartial<TaskTeam>);
    const saved = await this.taskRepo.save(task);
    await this.logService.logTask('create', saved.id, { userId, userRole, taskName: dto.task_name, assigneeId: dto.user_id });
    return saved;
  }

  async updateTask(id: number, dto: any, userId?: number, userRole?: string) {
    await this.taskRepo.update(id, dto);
    await this.logService.logTask('update', id, { userId, userRole, taskName: dto.task_name });
    return this.taskRepo.findOneBy({ id });
  }

  async removeTask(id: number, userId?: number, userRole?: string) {
    await this.logService.logTask('delete', id, { userId, userRole });
    await this.taskRepo.delete(id);
  }
}
