import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { TimelineProjectService } from './timeline_project.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('timeline-project')
export class TimelineProjectController {
  constructor(private readonly timelineProjectService: TimelineProjectService) {}

  @Get()
  @Render('timeline_project')
  async index(@Req() req: Request) {
    const sessionUser = (req.session as any)?.user;
    const viewer = sessionUser
      ? { userId: sessionUser.id, role: sessionUser.role }
      : null;

    const { teams, projects } = await this.timelineProjectService.getTimelineData(viewer);
    return {
      pageTitle:    'Project Timeline',
      pageSubtitle: 'Project schedule across all teams',
      teams,
      projects,
    };
  }
}
