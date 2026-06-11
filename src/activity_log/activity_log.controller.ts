import { Controller, Delete, Get, HttpCode, Param, Query, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActivityLogService } from './service/activity_log.service';

@Controller('activity-log')
@UseGuards(AuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly logService: ActivityLogService) {}

  @Get()
  @Render('activity_log')
  index() {
    return { pageTitle: 'Activity Log', pageSubtitle: 'บันทึกการใช้งานระบบ' };
  }

  @Get('api')
  findAll(
    @Query('action') action?: string,
    @Query('module') module?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page')   page?: string,
    @Query('limit')  limit?: string,
  ) {
    return this.logService.findAll({
      action, module, status, search,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 100,
    });
  }

  @Delete('api/:id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.logService.remove(+id);
  }

  @Delete('api')
  @HttpCode(204)
  removeAll() {
    return this.logService.removeAll();
  }
}
