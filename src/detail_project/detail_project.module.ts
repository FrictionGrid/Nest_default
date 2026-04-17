import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DetailProjectService } from './detail_project.service';
import { DetailProjectController } from './detail_project.controller';
import { DocumentService } from './service/document.service';
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
      storage: diskStorage({
        destination: (req, file, cb) => {
          const projectId = req.params.id;
          const dir = `uploads/documents/project_${projectId}`;
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    }),
  ],
  controllers: [DetailProjectController],
  providers: [DetailProjectService, DocumentService],
})
export class DetailProjectModule {}
