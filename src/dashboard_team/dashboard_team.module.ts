import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardTeamService } from './service/dashboard_team.service';
import { DashboardTeamController } from './dashboard_team.controller';
import { TaskTeam } from '../database/entities/task_team.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTeam, ProjectTeam, UsersTeam])],
  controllers: [DashboardTeamController],
  providers: [DashboardTeamService],
})
export class DashboardTeamModule {}
