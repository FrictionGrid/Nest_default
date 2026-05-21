import { Controller, Get, Query, Render, UseGuards } from '@nestjs/common';
import { SummaryYearService } from './service/summary_year.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('summary-year')
export class SummaryYearController {
  constructor(private readonly summaryYearService: SummaryYearService) {}

  @Get()
  @Render('summary_year')
  async index(@Query('year') yearStr?: string) {
    const availableYears = await this.summaryYearService.getAvailableYears();
    const year = yearStr ? Number(yearStr) : (availableYears[0] ?? new Date().getFullYear());

    const [summary, typeStats, regionStats, valueRangeStats, monthlySummary, teamSummary] =
      await Promise.all([
        this.summaryYearService.getSummary(year),
        this.summaryYearService.getTypeStats(year),
        this.summaryYearService.getRegionStats(year),
        this.summaryYearService.getValueRangeStats(year),
        this.summaryYearService.getMonthlySummary(year),
        this.summaryYearService.getTeamSummary(year),
      ]);

    return {
      pageTitle: 'Summary Year',
      pageSubtitle: `Annual report for ${year}`,
      year,
      availableYears,
      summary,
      typeStats,
      regionStats,
      valueRangeStats,
      monthlySummary,
      teamSummary,
    };
  }
}
