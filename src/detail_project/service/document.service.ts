import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../../database/entities/document_type.entity';
import { ProjectDocument } from '../../database/entities/project_document.entity';
import { ProjectDocumentFile } from '../../database/entities/project_document_file.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectTypeCategory } from '../../database/entities/project_type_category.entity';
import { SynologyService } from './synology.service';
import { ActivityLogService } from '../../activity_log/service/activity_log.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly docTypeRepo: Repository<DocumentType>,
    @InjectRepository(ProjectDocument)
    private readonly projectDocRepo: Repository<ProjectDocument>,
    @InjectRepository(ProjectDocumentFile)
    private readonly fileRepo: Repository<ProjectDocumentFile>,
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectTypeCategory)
    private readonly projectTypeCategoryRepo: Repository<ProjectTypeCategory>,
    private readonly nas: SynologyService,
    private readonly logService: ActivityLogService,
  ) {}

  // ── GET checklist ──────────────────────────────────────────────────────────
  async getChecklist(projectId: number) {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    const typeIds = project?.types?.map((t) => t.id) ?? [];

    if (typeIds.length === 0) {
      return { checklist: [], progress: { uploaded: 0, total: 0 }, docCategories: [] };
    }

    const mappings = await this.projectTypeCategoryRepo.find({
      where: typeIds.map((id) => ({ project_type_id: id })),
    });

    const allowedCategories = new Set(mappings.map((m) => m.category));

    if (allowedCategories.size === 0) {
      return { checklist: [], progress: { uploaded: 0, total: 0 }, docCategories: [] };
    }

    const allTypes = await this.docTypeRepo.find({ order: { sort_order: 'ASC' } });
    const types = allTypes.filter((t) => allowedCategories.has(t.category || 'engineer_task'));

    const docs = await this.projectDocRepo.find({
      where: { project_id: projectId },
      relations: ['files', 'files.uploader'],
    });

    const docMap = new Map(docs.map((d) => [d.document_type_id, d]));

    const checklist = types.map((type) => {
      const doc = docMap.get(type.id);
      return {
        typeId:      type.id,
        typeName:    type.name,
        isRequired:  type.is_required,
        category:    type.category || 'engineer_task',
        docId:       doc?.id ?? null,
        status:      doc?.status ?? 'missing',
        rejectedReason: doc?.rejected_reason ?? null,
        files: (doc?.files ?? []).map((f) => ({
          id:         f.id,
          filename:   f.filename,
          fileSize:   f.file_size,
          mimeType:   f.mime_type,
          uploadedBy: f.uploader?.display_name || f.uploader?.username || '—',
          uploadedAt: f.uploaded_at,
        })),
      };
    });

    const total    = types.filter((t) => t.is_required).length;
    const uploaded = checklist.filter((c) => c.isRequired && c.status !== 'missing').length;

    const CATEGORY_LABEL: Record<string, string> = {
      engineer_task: 'Engineer',
      draft:         'Draft',
    };
    const uniqueCategories = [...new Set(types.map((t) => t.category || 'engineer_task'))];
    const docCategories = uniqueCategories.map((key) => ({
      key,
      label: CATEGORY_LABEL[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    return { checklist, progress: { uploaded, total }, docCategories };
  }

  // ── UPLOAD file ───────────────────────────────────────────────────────────
  async uploadFile(
    projectId: number,
    typeId: number,
    file: Express.Multer.File,
    userId: number,
    userRole?: string,
  ) {
    const sanitize = (s: string) => s.replace(/[/\\:*?"<>|]/g, '_').trim();

    const [project, docType] = await Promise.all([
      this.projectRepo.findOne({ where: { id: projectId } }),
      this.docTypeRepo.findOne({ where: { id: typeId } }),
    ]);

    const projectFolder = project?.project_name ? sanitize(project.project_name) : `project_${projectId}`;
    const typeFolder    = docType?.name         ? sanitize(docType.name)          : `type_${typeId}`;

    const baseFolder = `${projectFolder}/${typeFolder}`;
    const nasPath = await this.nas.uploadFile(file.buffer, file.originalname, `${baseFolder}/main`);
    this.nas.uploadFile(file.buffer, file.originalname, `${baseFolder}/backup`).catch(() => {});

    let doc = await this.projectDocRepo.findOne({
      where: { project_id: projectId, document_type_id: typeId },
    });

    if (!doc) {
      doc = this.projectDocRepo.create({
        project_id: projectId,
        document_type_id: typeId,
        status: 'uploaded',
      });
      await this.projectDocRepo.save(doc);
    } else {
      doc.status = 'uploaded';
      await this.projectDocRepo.save(doc);
    }

    const newFile = this.fileRepo.create({
      project_document_id: doc.id,
      filename:    file.originalname,
      file_path:   nasPath,
      file_size:   file.size,
      mime_type:   file.mimetype,
      uploaded_by: userId,
    });
    await this.fileRepo.save(newFile);
    await this.logService.logDocument('upload', {
      userId, userRole,
      fileId: newFile.id,
      fileName: file.originalname,
      projectName: project?.project_name,
    });
    return { success: true, fileId: newFile.id };
  }

  // ── DELETE file ───────────────────────────────────────────────────────────
  async deleteFile(fileId: number, userId?: number, userRole?: string) {
    const file = await this.fileRepo.findOne({
      where: { id: fileId },
      relations: ['projectDocument', 'projectDocument.files'],
    });
    if (!file) throw new NotFoundException('File not found');

    await this.nas.deleteFile(file.file_path);
    await this.fileRepo.remove(file);

    const remaining = file.projectDocument.files.filter((f) => f.id !== fileId);
    if (remaining.length === 0) {
      await this.projectDocRepo.update(file.projectDocument.id, { status: 'missing' });
    }
    await this.logService.logDocument('delete', { userId, userRole, fileId, fileName: file.filename });
    return { success: true };
  }

  // ── DOWNLOAD file ─────────────────────────────────────────────────────────
  async getFileRecord(fileId: number) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async getDownloadStream(nasPath: string) {
    return this.nas.downloadStream(nasPath);
  }
}
