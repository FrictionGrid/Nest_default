import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManageTeamService } from './service/manage_team.service';
import { ManageTeamController } from './manage_team.controller';
import { UsersTeam } from '../database/entities/users_team.entity';
import { User } from '../database/entities/user.entity';
import { Team } from '../database/entities/team.entity';
import { TaskTeam } from '../database/entities/task_team.entity';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersTeam, User, Team, TaskTeam, ProjectIncoming, ProjectTeam])],
  controllers: [ManageTeamController],
  providers: [ManageTeamService],
})
export class ManageTeamModule {}
