import { Controller, Get, Post, Body, Param, Delete, Put, Render, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ManageTeamService } from './service/manage_team.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateManageTeamDto } from './dto/create-manage_team.dto';
import { UpdateManageTeamDto } from './dto/update-manage_team.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('manage-task')
export class ManageTeamController {
  constructor(private readonly manageTeamService: ManageTeamService) {}

  @Get()
  @Render('manage_team')
  async index(@Req() req: Request) {
    const sessionUser = (req.session as any).user;
    const isScoped    = sessionUser?.role === 'head_engineer';
    const userId      = sessionUser?.id;

    const [members, userList, teamList, tasks, projectList] = await Promise.all([
      this.manageTeamService.findAll(),
      isScoped
        ? this.manageTeamService.findUsersScoped(userId)
        : this.manageTeamService.findAllUsers(),
      isScoped
        ? this.manageTeamService.findTeamsByUser(userId)
        : this.manageTeamService.findAllTeams(),
      isScoped
        ? this.manageTeamService.findTasksScoped(userId)
        : this.manageTeamService.findAllTasks(),
      isScoped
        ? this.manageTeamService.findProjectsScoped(userId)
        : this.manageTeamService.findAllProjects(),
    ]);

    return { pageTitle: 'Manage Task', pageSubtitle: 'Track and update team tasks', members, userList, teamList, tasks, projectList };
  }

  // ── User-Team endpoints ──────────────────────────────────────────────────

  @Get('api')
  findAll() {
    return this.manageTeamService.findAll();
  }

  @Post('api')
  create(@Body() dto: CreateManageTeamDto) {
    return this.manageTeamService.create(dto);
  }

  @Put('api/:id')
  update(@Param('id') id: string, @Body() dto: UpdateManageTeamDto) {
    return this.manageTeamService.update(+id, dto);
  }

  @Delete('api/:id')
  remove(@Param('id') id: string) {
    return this.manageTeamService.remove(+id);
  }

  // ── Task endpoints ───────────────────────────────────────────────────────

  @Get('api/tasks')
  findAllTasks() {
    return this.manageTeamService.findAllTasks();
  }

  @Post('api/tasks')
  async createTask(@Req() req: Request, @Body() dto: any) {
    const sessionUser = (req.session as any).user;
    if (sessionUser?.role === 'head_engineer') {
      await this.manageTeamService.assertProjectInUserTeam(+dto.project_id, sessionUser.id);
    }
    return this.manageTeamService.createTask(dto);
  }

  @Put('api/tasks/:id')
  async updateTask(@Req() req: Request, @Param('id') id: string, @Body() dto: any) {
    const sessionUser = (req.session as any).user;
    if (sessionUser?.role === 'head_engineer') {
      await this.manageTeamService.assertTaskInUserTeam(+id, sessionUser.id);
    }
    return this.manageTeamService.updateTask(+id, dto);
  }

  @Delete('api/tasks/:id')
  async removeTask(@Req() req: Request, @Param('id') id: string) {
    const sessionUser = (req.session as any).user;
    if (sessionUser?.role === 'head_engineer') {
      await this.manageTeamService.assertTaskInUserTeam(+id, sessionUser.id);
    }
    return this.manageTeamService.removeTask(+id);
  }
}
