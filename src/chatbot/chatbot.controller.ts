import { Controller, Get, Post, Body, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { ChatService } from './service/chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chatbot')
@UseGuards(AuthGuard)
export class ChatbotController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Render('chatbot')
  index() {
    return {
      pageTitle: 'Chatbot (Development phase)',
      pageSubtitle: 'ผู้ช่วยอัจฉริยะ (ยังไม่พร้อมใช้งาน)',
    };
  }

  @Post('chat')
  async chat(@Body() dto: ChatMessageDto) {
    return this.chatService.respond(dto.message);
  }
}
