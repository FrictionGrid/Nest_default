import { Controller, Get, Post, Put, Delete, Body, Param, Res, Render, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ManageProjectHelpService } from './service/manage_project_help.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateDayRateDto } from './dto/create-day-rate.dto';
import { CreateDayAdjustmentDto } from './dto/create-day-adjustment.dto';
import { UpdateBudgetAllocationDto } from './dto/update-budget-allocation.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('manage-project-help')
export class ManageProjectHelpController {
  constructor(private readonly manageProjectHelpService: ManageProjectHelpService) {}

  @Get()
  @Render('manage_project_help')
  async index() {
    const projects = await this.manageProjectHelpService.findAllProjects();
    const dayRate = this.manageProjectHelpService.getDayRate();
    return {
      pageTitle: 'Manage Project Help',
      pageSubtitle: 'Estimate project duration and budget allocation from PO value',
      projects,
      dayRate,
    };
  }

  @Get(':id')
  async detail(@Param('id') id: string, @Res() res: Response) {
    const data = await this.manageProjectHelpService.findProjectDetail(+id);
    return res.render('manage_project_help_detail', data);
  }

  @Post('api/day-rate')
  setDayRate(@Body() dto: CreateDayRateDto) {
    return this.manageProjectHelpService.setDayRate(dto.day_rate);
  }

  @Post('api/:id/adjustments')
  addAdjustment(@Param('id') id: string, @Body() dto: CreateDayAdjustmentDto) {
    return this.manageProjectHelpService.addAdjustment(+id, dto);
  }

  @Delete('api/adjustments/:id')
  removeAdjustment(@Param('id') id: string) {
    return this.manageProjectHelpService.removeAdjustment(+id);
  }

  @Put('api/:id/budget-allocation')
  upsertBudgetAllocation(@Param('id') id: string, @Body() dto: UpdateBudgetAllocationDto) {
    return this.manageProjectHelpService.upsertBudgetAllocation(+id, dto);
  }
}
