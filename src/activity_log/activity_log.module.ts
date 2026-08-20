import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogController } from './activity_log.controller';
import { ActivityLogService } from './service/activity_log.service';
import { ActivityLogInterceptor } from '../common/interceptors/activity_log.interceptor';
import { ActivityLog } from '../database/entities/activity_log.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { ProjectMain } from '../database/entities/project_main.entity';
import { TaskTeam } from '../database/entities/task_team.entity';
import { User } from '../database/entities/user.entity';
import { ProjectDocumentFile } from '../database/entities/project_document_file.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityLog,
      ProjectTeam,
      ProjectMain,
      TaskTeam,
      User,
      ProjectDocumentFile,
    ]),
  ],
  controllers: [ActivityLogController],
  providers: [
    ActivityLogService,
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
