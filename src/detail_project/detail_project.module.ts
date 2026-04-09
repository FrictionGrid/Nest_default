import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetailProjectService } from './detail_project.service';
import { DetailProjectController } from './detail_project.controller';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { TaskTeam } from '../database/entities/task_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectIncoming, ProjectTeam, TaskTeam])],
  controllers: [DetailProjectController],
  providers: [DetailProjectService],
})
export class DetailProjectModule {}
