import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManageProjectService } from './service/manage_project.service';
import { ManageProjectController } from './manage_project.controller';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { Team } from '../database/entities/team.entity';
import { UsersTeam } from '../database/entities/users_team.entity';
import { TaskTeam } from '../database/entities/task_team.entity';
import { DocumentType } from '../database/entities/document_type.entity';
import { ProjectDocument } from '../database/entities/project_document.entity';
import { ProjectTypeCategory } from '../database/entities/project_type_category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTeam, ProjectIncoming, Team, UsersTeam, TaskTeam, DocumentType, ProjectDocument, ProjectTypeCategory])],
  controllers: [ManageProjectController],
  providers: [ManageProjectService],
})
export class ManageProjectModule {}
