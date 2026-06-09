import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('chatbot')
@UseGuards(AuthGuard)
export class ChatbotController {
  @Get()
  @Render('chatbot')
  index() {
    return {
      pageTitle: 'Chatbot (not open now)',
      pageSubtitle: 'ผู้ช่วยอัจฉริยะ',
    };
  }
}
