import {
  Controller, Get, Post, Delete,
  Param, Req, Res, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { DetailProjectService } from './detail_project.service';
import { DocumentService } from './service/document.service';
import { ActivityLogService } from '../activity_log/service/activity_log.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('detail-project')
export class DetailProjectController {
  constructor(
    private readonly detailProjectService: DetailProjectService,
    private readonly documentService: DocumentService,
    private readonly logService: ActivityLogService,
  ) {}

  // ── Page ──────────────────────────────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const data = await this.detailProjectService.findById(+id);
    const { checklist, progress, docCategories } = await this.documentService.getChecklist(+id);
    return res.render('detail_project', { ...data, checklist, progress, docCategories });
  }

  // ── GET documents checklist (API) ─────────────────────────────────────────
  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    return this.documentService.getChecklist(+id);
  }

  // ── UPLOAD file ───────────────────────────────────────────────────────────
  @Post(':id/documents/:typeId/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const { id: userId, role } = (req.session as any).user ?? {};
    return this.documentService.uploadFile(+id, +typeId, file, userId, role);
  }

  // ── DELETE file ───────────────────────────────────────────────────────────
  @Delete('documents/file/:fileId')
  async deleteFile(@Param('fileId') fileId: string, @Req() req: Request) {
    const { id: userId, role } = (req.session as any).user ?? {};
    return this.documentService.deleteFile(+fileId, userId, role);
  }

  // ── DOWNLOAD file ─────────────────────────────────────────────────────────
  @Get('documents/file/:fileId/download')
  async downloadFile(@Param('fileId') fileId: string, @Req() req: Request, @Res() res: Response) {
    const { id: userId, role } = (req.session as any).user ?? {};
    const file   = await this.documentService.getFileRecord(+fileId);
    const nasRes = await this.documentService.getDownloadStream(file.file_path);

    await this.logService.logDocument('download', { userId, userRole: role, fileId: +fileId, fileName: file.filename });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
    const contentType   = nasRes.headers['content-type'];
    const contentLength = nasRes.headers['content-length'];
    if (contentType)   res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    nasRes.data.pipe(res);
  }
}
