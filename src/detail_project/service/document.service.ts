import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../../database/entities/document_type.entity';
import { ProjectDocument } from '../../database/entities/project_document.entity';
import { ProjectDocumentFile } from '../../database/entities/project_document_file.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly docTypeRepo: Repository<DocumentType>,
    @InjectRepository(ProjectDocument)
    private readonly projectDocRepo: Repository<ProjectDocument>,
    @InjectRepository(ProjectDocumentFile)
    private readonly fileRepo: Repository<ProjectDocumentFile>,
  ) {}

  // ── GET checklist ──────────────────────────────────────────────────────────
  async getChecklist(projectId: number) {
    const types = await this.docTypeRepo.find({ order: { sort_order: 'ASC' } });

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

    return { checklist, progress: { uploaded, total } };
  }

  // ── UPLOAD file ───────────────────────────────────────────────────────────
  async uploadFile(
    projectId: number,
    typeId: number,
    file: Express.Multer.File,
    userId: number,
  ) {
    // หา or สร้าง project_document
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

    // บันทึก file record
    const newFile = this.fileRepo.create({
      project_document_id: doc.id,
      filename:    file.originalname,
      file_path:   file.path,
      file_size:   file.size,
      mime_type:   file.mimetype,
      uploaded_by: userId,
    });
    await this.fileRepo.save(newFile);

    return { success: true, fileId: newFile.id };
  }

  // ── DELETE file ───────────────────────────────────────────────────────────
  async deleteFile(fileId: number) {
    const file = await this.fileRepo.findOne({
      where: { id: fileId },
      relations: ['projectDocument', 'projectDocument.files'],
    });
    if (!file) throw new NotFoundException('File not found');

    // ลบไฟล์จริงบน disk
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    await this.fileRepo.remove(file);

    // ถ้าไม่เหลือไฟล์ → reset status กลับเป็น missing
    const remaining = file.projectDocument.files.filter((f) => f.id !== fileId);
    if (remaining.length === 0) {
      await this.projectDocRepo.update(file.projectDocument.id, { status: 'missing' });
    }

    return { success: true };
  }

  // ── DOWNLOAD file ─────────────────────────────────────────────────────────
  async getFilePath(fileId: number): Promise<string> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    return path.resolve(file.file_path);
  }
}
