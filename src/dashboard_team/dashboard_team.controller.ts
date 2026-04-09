import { Controller, Get, Put, Param, Render } from '@nestjs/common';
import { DashboardTeamService } from './service/dashboard_team.service';

@Controller('dashboard-team')
export class DashboardTeamController {
  constructor(private readonly dashboardTeamService: DashboardTeamService) {}

  @Get()
  @Render('dashboard_team')
  async index() {
    const [summary, tasks, teamProjects] = await Promise.all([
      this.dashboardTeamService.getSummary(),
      this.dashboardTeamService.getTasksThisMonth(),
      this.dashboardTeamService.getTeamProjects(),
    ]);
    return { pageTitle: 'Dashboard Team', summary, tasks, teamProjects };
  }

  @Put('api/tasks/:id/complete')
  async completeTask(@Param('id') id: string) {
    return this.dashboardTeamService.completeTask(+id);
  }
}
