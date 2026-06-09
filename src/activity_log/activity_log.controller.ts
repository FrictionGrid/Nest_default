import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('activity-log')
@UseGuards(AuthGuard)
export class ActivityLogController {
  @Get()
  @Render('activity_log')
  index() {
    return {
      pageTitle: 'Activity Log (not open now)',
      pageSubtitle: 'บันทึกการใช้งานระบบ',
    };
  }
}
