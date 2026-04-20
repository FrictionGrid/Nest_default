import { Controller, Get, Post, Body, Param, Delete, Put, Render, UseGuards } from '@nestjs/common';
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
  async index() {
    const [members, userList, teamList, tasks, projectList] = await Promise.all([
      this.manageTeamService.findAll(),
      this.manageTeamService.findAllUsers(),
      this.manageTeamService.findAllTeams(),
      this.manageTeamService.findAllTasks(),
      this.manageTeamService.findAllProjects(),
    ]);
    return { pageTitle: 'Manage Task', members, userList, teamList, tasks, projectList };
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
  createTask(@Body() dto: any) {
    return this.manageTeamService.createTask(dto);
  }

  @Put('api/tasks/:id')
  updateTask(@Param('id') id: string, @Body() dto: any) {
    return this.manageTeamService.updateTask(+id, dto);
  }

  @Delete('api/tasks/:id')
  removeTask(@Param('id') id: string) {
    return this.manageTeamService.removeTask(+id);
  }
}
