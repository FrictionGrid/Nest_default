import { Controller, Get, Render } from '@nestjs/common';
import { OverviewProjectService } from './service/overview_project.service';

@Controller('overview-project')
export class OverviewProjectController {
  constructor(private readonly overviewProjectService: OverviewProjectService) {}

  @Get()
  @Render('overview_project')
  async index() {
    const [summary, teams, recentProjects, monthlySummary] = await Promise.all([
      this.overviewProjectService.getSummary(),
      this.overviewProjectService.getTeamStats(),
      this.overviewProjectService.getRecentProjects(),
      this.overviewProjectService.getMonthlySummary(),
    ]);
    return { pageTitle: 'Overview', summary, teams, recentProjects, monthlySummary };
  }
}
