import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserManagementController } from './user_management.controller';
import { UserManagementService } from './service/user_management.service';
import { User } from '../database/entities/user.entity';
import { Team } from '../database/entities/team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Team, UsersTeam])],
  controllers: [UserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
