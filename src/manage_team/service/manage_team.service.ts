import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersTeam } from '../../database/entities/users_team.entity';
import { User } from '../../database/entities/user.entity';
import { Team } from '../../database/entities/team.entity';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
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
      team_role: r.team_role,
      joined_at: r.joined_at,
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

    return rows.map((r) => ({
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
