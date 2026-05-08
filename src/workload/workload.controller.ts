import { Controller, Get, Param, Render, UseGuards } from '@nestjs/common';
import { WorkloadService } from './service/workload.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('workload')
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) {}

  @Get()
  @Render('workload')
  async index() {
    const users = await this.workloadService.getUserWorkloads();
    return { pageTitle: 'Workload', pageSubtitle: 'Team capacity overview', users };
  }

  @Get(':userId')
  @Render('workload_detail')
  async detail(@Param('userId') userId: string) {
    const data = await this.workloadService.getUserDetail(+userId);
    return { pageTitle: 'Workload', pageSubtitle: 'Member workload detail', data };
  }
}
