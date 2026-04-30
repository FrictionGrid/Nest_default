import { Controller, Get, Put, Patch, Param, Body, Render, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DashboardTeamService } from './service/dashboard_team.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('dashboard-team')
export class DashboardTeamController {
  constructor(private readonly dashboardTeamService: DashboardTeamService) {}

  @Get()
  @Render('dashboard_team')
  async index(@Req() req: Request) {
    const userId = (req.session as any).user?.id;
    const [summary, tasks, teamProjects] = await Promise.all([
      this.dashboardTeamService.getSummary(userId),
      this.dashboardTeamService.getTasksThisMonth(userId),
      this.dashboardTeamService.getTeamProjects(userId),
    ]);
    return { pageTitle: 'Dashboard Team', pageSubtitle: 'Team task overview and progress', summary, tasks, teamProjects };
  }

  @Patch('api/tasks/:id/progress')
  async updateProgress(@Param('id') id: string, @Body('progress') progress: number) {
    return this.dashboardTeamService.updateProgress(+id, +progress);
  }

  @Put('api/tasks/:id/complete')
  async completeTask(@Param('id') id: string, @Body('description') description?: string) {
    return this.dashboardTeamService.completeTask(+id, description);
  }

  @Put('api/tasks/:id/problem')
  async problemTask(@Param('id') id: string, @Body('description') description?: string) {
    return this.dashboardTeamService.problemTask(+id, description);
  }
}
