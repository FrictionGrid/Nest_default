import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { Team } from '../../database/entities/team.entity';
import { UsersTeam } from '../../database/entities/users_team.entity';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(User)      private userRepo: Repository<User>,
    @InjectRepository(Team)      private teamRepo: Repository<Team>,
    @InjectRepository(UsersTeam) private userTeamRepo: Repository<UsersTeam>,
  ) {}

  // ── Users ────────────────────────────────────────────────────────────────

  async findAllUsers() {
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('user_teams', 'ut', 'ut.user_id = u.id')
      .leftJoin('team', 't', 't.id = ut.team_id')
      .select('u.id',            'id')
      .addSelect('u.username',     'username')
      .addSelect('u.display_name', 'display_name')
      .addSelect('u.email',        'email')
      .addSelect('u.role',         'role')
      .addSelect('u.status',       'status')
      .addSelect('u.created_at',   'created_at')
      .addSelect('t.id',           'team_id')
      .addSelect('t.name',         'team_name')
      .orderBy('u.id', 'ASC')
      .getRawMany();

    const map = new Map<number, any>();
    rows.forEach((r) => {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id, username: r.username, display_name: r.display_name,
          email: r.email, role: r.role, status: r.status,
          created_at: r.created_at, teams: [],
        });
      }
      if (r.team_id) map.get(r.id).teams.push({ id: r.team_id, name: r.team_name });
    });
    return Array.from(map.values());
  }

  async createUser(dto: { username: string; display_name?: string; email: string; password: string; role: string; status?: string }) {
    const exists = await this.userRepo.findOne({ where: [{ username: dto.username }, { email: dto.email }] });
    if (exists) throw new ConflictException('Username or email already exists');
    const user = this.userRepo.create({
      username:     dto.username,
      display_name: dto.display_name,
      email:        dto.email,
      password:     dto.password,
      role:         dto.role as UserRole,
      status:       dto.status || 'active',
    });
    return this.userRepo.save(user);
  }

  async updateUser(id: number, dto: { display_name?: string; email?: string; password?: string; role?: string; status?: string }) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    if (dto.password === '' || dto.password === null) delete dto.password;
    await this.userRepo.update(id, {
      ...(dto.display_name !== undefined && { display_name: dto.display_name }),
      ...(dto.email        !== undefined && { email:        dto.email }),
      ...(dto.password     !== undefined && { password:     dto.password }),
      ...(dto.role         !== undefined && { role:         dto.role as UserRole }),
      ...(dto.status       !== undefined && { status:       dto.status }),
    });
    return this.userRepo.findOneBy({ id });
  }

  async removeUser(id: number) {
    await this.userRepo.delete(id);
  }

  // ── Teams ────────────────────────────────────────────────────────────────

  findAllTeams() {
    return this.teamRepo.find({ order: { id: 'ASC' } });
  }

  async createTeam(dto: { name: string }) {
    const exists = await this.teamRepo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Team name already exists');
    const team = this.teamRepo.create(dto);
    return this.teamRepo.save(team);
  }

  async updateTeam(id: number, dto: { name: string }) {
    await this.teamRepo.update(id, dto);
    return this.teamRepo.findOneBy({ id });
  }

  async removeTeam(id: number) {
    await this.teamRepo.delete(id);
  }

  // ── User-Team Assignment ─────────────────────────────────────────────────

  async assignTeam(dto: { user_id: number; team_id: number }) {
    const exists = await this.userTeamRepo.findOne({ where: { user_id: dto.user_id, team_id: dto.team_id } });
    if (exists) throw new ConflictException('Assignment already exists');
    const row = this.userTeamRepo.create(dto);
    return this.userTeamRepo.save(row);
  }

  async removeAssignmentByUserTeam(userId: number, teamId: number) {
    await this.userTeamRepo.delete({ user_id: userId, team_id: teamId });
  }

  async findAssignmentsByUser(userId: number) {
    return this.userTeamRepo.find({ where: { user_id: userId }, relations: ['team'] });
  }
}
