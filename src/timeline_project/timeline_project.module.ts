import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineProjectController } from './timeline_project.controller';
import { TimelineProjectService } from './timeline_project.service';
import { Team } from '../database/entities/team.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Team, ProjectTeam, UsersTeam])],
  controllers: [TimelineProjectController],
  providers: [TimelineProjectService],
})
export class TimelineProjectModule {}
