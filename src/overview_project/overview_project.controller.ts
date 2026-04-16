import { Controller, Get, Query, Render, UseGuards } from '@nestjs/common';
import { OverviewProjectService } from './service/overview_project.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('overview-project')
export class OverviewProjectController {
  constructor(private readonly overviewProjectService: OverviewProjectService) {}

  @Get()
  @Render('overview_project')
  async index() {
    const [summary, teams, recentProjects, monthlySummary] = await Promise.all([
      this.overviewProjectService.getSummary(),
      this.overviewProjectService.getTeamStats('all'),
      this.overviewProjectService.getRecentProjects(),
      this.overviewProjectService.getMonthlySummary(),
    ]);
    return { pageTitle: 'Overview Project', summary, teams, recentProjects, monthlySummary };
  }

  @Get('api/team-stats')
  async teamStats(@Query('range') range: string = 'all') {
    return this.overviewProjectService.getTeamStats(range);
  }
}
