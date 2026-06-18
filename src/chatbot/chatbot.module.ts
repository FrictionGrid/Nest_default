import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotController } from './chatbot.controller';
import { ClassifyService } from './service/classify.service';
import { LogicService } from './service/logic.service';
import { ApiService } from './service/api.service';
import { ChatService } from './service/chat.service';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { TaskTeam } from '../database/entities/task_team.entity';
import { Team } from '../database/entities/team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';
import { PaymentInstallment } from '../database/entities/payment_installment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectIncoming,
      TaskTeam,
      Team,
      UsersTeam,
      PaymentInstallment,
    ]),
  ],
  controllers: [ChatbotController],
  providers: [ClassifyService, LogicService, ApiService, ChatService],
})
export class ChatbotModule {}
