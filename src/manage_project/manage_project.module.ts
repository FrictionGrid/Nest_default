import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManageProjectService } from './service/manage_project.service';
import { ManageProjectController } from './manage_project.controller';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { ProjectMain } from '../database/entities/project_main.entity';
import { Team } from '../database/entities/team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTeam, ProjectMain, Team, UsersTeam])],
  controllers: [ManageProjectController],
  providers: [ManageProjectService],
})
export class ManageProjectModule {}
