import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DetailProjectService } from './detail_project.service';
import { DetailProjectController } from './detail_project.controller';
import { DocumentService } from './service/document.service';
import { SynologyService } from './service/synology.service';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { TaskTeam } from '../database/entities/task_team.entity';
import { DocumentType } from '../database/entities/document_type.entity';
import { ProjectDocument } from '../database/entities/project_document.entity';
import { ProjectDocumentFile } from '../database/entities/project_document_file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectIncoming, ProjectTeam, TaskTeam,
      DocumentType, ProjectDocument, ProjectDocumentFile,
    ]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  ],
  controllers: [DetailProjectController],
  providers: [DetailProjectService, DocumentService, SynologyService],
})
export class DetailProjectModule {}
