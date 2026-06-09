import { Controller, Get, Post, Delete, Param, Body, Render, UseGuards, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FeedbackService } from './feedback.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @Render('feedback')
  async index() {
    const feedbacks = await this.feedbackService.findAll();
    return {
      pageTitle: 'Feedback',
      pageSubtitle: 'แจ้งปัญหาหรือข้อเสนอแนะเพื่อพัฒนาระบบ',
      feedbacks,
    };
  }

  @Get('inbox')
  @Render('feedback_inbox')
  async inbox() {
    const feedbacks = await this.feedbackService.findAll();
    return {
      pageTitle: 'Feedback Inbox',
      pageSubtitle: 'รายการ Feedback จากผู้ใช้งานในระบบ',
      feedbacks,
    };
  }

  @Delete('api/:id')
  async remove(@Param('id') id: string) {
    await this.feedbackService.remove(+id);
    return { ok: true };
  }

  @Post('api')
  async create(@Req() req: Request, @Res() res: Response, @Body('message') message: string) {
    const userId = (req.session as any).user?.id ?? null;
    if (!message?.trim()) return res.status(400).json({ error: 'message required' });
    await this.feedbackService.create(message.trim(), userId);
    return res.json({ ok: true });
  }
}
