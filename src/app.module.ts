import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { IncomingProjectModule } from './incoming_project/incoming_project.module';
import { ActivityLog } from './database/entities/activity_log.entity';
import { ProjectIncoming } from './database/entities/project_incoming.entity';
import { ProjectType } from './database/entities/project_type.entity';
import { Team } from './database/entities/team.entity';
import { ProjectTeam } from './database/entities/project_team.entity';
import { ManageProjectModule } from './manage_project/manage_project.module';
import { ManageTeamModule } from './manage_team/manage_team.module';
import { User } from './database/entities/user.entity';
import { UsersTeam } from './database/entities/users_team.entity';
import { TaskTeam } from './database/entities/task_team.entity';
import { OverviewProjectModule } from './overview_project/overview_project.module';
import { DetailProjectModule } from './detail_project/detail_project.module';
import { DashboardTeamModule } from './dashboard_team/dashboard_team.module';
import { TimelineModule } from './timeline/timeline.module';
import { TimelineProjectModule } from './timeline_project/timeline_project.module';
import { UserManagementModule } from './user_management/user_management.module';
import { WorkloadModule } from './workload/workload.module';
import { SummaryYearModule } from './summary_year/summary_year.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentInstallment } from './database/entities/payment_installment.entity';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ActivityLogModule } from './activity_log/activity_log.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { FeedbackModule } from './feedback/feedback.module';
import { UserContextMiddleware } from './common/middleware/user-context.middleware';
import { DocumentType } from './database/entities/document_type.entity';
import { ProjectDocument } from './database/entities/project_document.entity';
import { ProjectDocumentFile } from './database/entities/project_document_file.entity';
import { ProjectTypeCategory } from './database/entities/project_type_category.entity';
import { Feedback } from './database/entities/feedback.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // ── 5. Rate Limiting: จำกัด 100 req/นาที ต่อ 1 IP ──────────────────────
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [ActivityLog, ProjectIncoming, ProjectType, Team, ProjectTeam, User, UsersTeam, TaskTeam, DocumentType, ProjectDocument, ProjectDocumentFile, PaymentInstallment, Feedback, ProjectTypeCategory],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    IncomingProjectModule,
    ManageProjectModule,
    ManageTeamModule,
    OverviewProjectModule,
    DetailProjectModule,
    DashboardTeamModule,
    TimelineModule,
    TimelineProjectModule,
    UserManagementModule,
    WorkloadModule,
    SummaryYearModule,
    PaymentModule,
    ProfileModule,
    ActivityLogModule,
    ChatbotModule,
    FeedbackModule,
  ],
  providers: [
    // ── 5. Rate Limiting Guard (global) ──────────────────────────────────────
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
