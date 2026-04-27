import { Controller, Get, Post, Put, Delete, Body, Param, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserManagementService } from './service/user_management.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('user-management')
export class UserManagementController {
  constructor(private readonly svc: UserManagementService) {}

  @Get()
  @Render('manage_user')
  async index() {
    const [users, teams] = await Promise.all([
      this.svc.findAllUsers(),
      this.svc.findAllTeams(),
    ]);
    return { pageTitle: 'User Management', pageSubtitle: 'Manage users, teams and role assignments', users, teams };
  }

  // ── User API ─────────────────────────────────────────────────────────────

  @Get('api/users')
  getUsers() { return this.svc.findAllUsers(); }

  @Post('api/users')
  createUser(@Body() dto: any) { return this.svc.createUser(dto); }

  @Put('api/users/:id')
  updateUser(@Param('id') id: string, @Body() dto: any) { return this.svc.updateUser(+id, dto); }

  @Delete('api/users/:id')
  removeUser(@Param('id') id: string) { return this.svc.removeUser(+id); }

  // ── Team API ─────────────────────────────────────────────────────────────

  @Get('api/teams')
  getTeams() { return this.svc.findAllTeams(); }

  @Post('api/teams')
  createTeam(@Body() dto: any) { return this.svc.createTeam(dto); }

  @Put('api/teams/:id')
  updateTeam(@Param('id') id: string, @Body() dto: any) { return this.svc.updateTeam(+id, dto); }

  @Delete('api/teams/:id')
  removeTeam(@Param('id') id: string) { return this.svc.removeTeam(+id); }

  // ── Assignment API ────────────────────────────────────────────────────────

  @Post('api/assignments')
  assignTeam(@Body() dto: any) { return this.svc.assignTeam(dto); }

  @Post('api/assignments/remove')
  removeAssignment(@Body() dto: { user_id: number; team_id: number }) {
    return this.svc.removeAssignmentByUserTeam(dto.user_id, dto.team_id);
  }
}
