import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManageProjectService } from './service/manage_project.service';
import { ManageProjectController } from './manage_project.controller';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { Team } from '../database/entities/team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTeam, ProjectIncoming, Team, UsersTeam])],
  controllers: [ManageProjectController],
  providers: [ManageProjectService],
})
export class ManageProjectModule {}
