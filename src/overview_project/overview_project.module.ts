import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OverviewProjectService } from './service/overview_project.service';
import { OverviewProjectController } from './overview_project.controller';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { Team } from '../database/entities/team.entity';
import { ProjectType } from '../database/entities/project_type.entity';
import { TaskTeam } from '../database/entities/task_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectIncoming, ProjectTeam, Team, ProjectType, TaskTeam])],
  controllers: [OverviewProjectController],
  providers: [OverviewProjectService],
})
export class OverviewProjectModule {}
