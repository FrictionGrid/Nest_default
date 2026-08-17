import { Controller, Get, Param, Post, Render, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OtApprovalService } from './ot_approval.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class OtApprovalController {
  constructor(private readonly otApprovalService: OtApprovalService) {}

  @Get('ot-approval')
  @Render('ot_approval')
  approveOt() {
    return this.otApprovalService.getPageMeta();
  }

  @Get('ot-approval/api/queue')
  async queue(@Req() req: Request) {
    const user = (req.session as any).user;
    return this.otApprovalService.getQueue(user);
  }

  @Post('ot-approval/api/requests/:id/approve')
  async approve(@Req() req: Request, @Param('id') id: string) {
    const user = (req.session as any).user;
    return this.otApprovalService.approve(user, +id);
  }

  @Post('ot-approval/api/requests/:id/reject')
  async reject(@Req() req: Request, @Param('id') id: string) {
    const user = (req.session as any).user;
    return this.otApprovalService.reject(user, +id);
  }
}
