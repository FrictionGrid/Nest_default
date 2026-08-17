import { Body, Controller, Get, Post, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MyOtService } from './my_ot.service';
import type { CreateOtRequestInput } from './my_ot.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class MyOtController {
  constructor(private readonly myOtService: MyOtService) {}

  @Get('ot')
  @Render('ot')
  myOt() {
    return { pageTitle: 'My OT', pageSubtitle: 'ยื่นคำขอ OT และดูสถานะของฉัน' };
  }

  @Get('ot/api/projects')
  async projects() {
    return this.myOtService.listProjects();
  }

  @Get('ot/api/requests')
  async myRequests(@Req() req: Request) {
    const userId = (req.session as any).user.id;
    return this.myOtService.findMine(userId);
  }

  @Post('ot/api/requests')
  async createRequest(@Req() req: Request, @Body() body: CreateOtRequestInput) {
    const userId = (req.session as any).user.id;
    return this.myOtService.create(userId, body);
  }
}
