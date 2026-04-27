import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TimelineService } from './timeline.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @Render('timeline')
  async index(@Req() req: Request) {
    const sessionUser = (req.session as any)?.user;
    const viewer = sessionUser
      ? { userId: sessionUser.id, role: sessionUser.role }
      : null;

    const { users, tasks, teams } = await this.timelineService.getTimelineData(viewer);
    return {
      pageTitle: 'Timeline',
      pageSubtitle: 'Workload and task distribution across your team',
      users,
      tasks,
      teams,
    };
  }
}
