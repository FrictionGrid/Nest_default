import {
  Controller, Get, Post, Delete,
  Param, Req, Res, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { DetailProjectService } from './detail_project.service';
import { DocumentService } from './service/document.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('detail-project')
export class DetailProjectController {
  constructor(
    private readonly detailProjectService: DetailProjectService,
    private readonly documentService: DocumentService,
  ) {}

  // ── Page ──────────────────────────────────────────────────────────────────
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const data = await this.detailProjectService.findById(+id);
    const { checklist, progress } = await this.documentService.getChecklist(+id);
    return res.render('detail_project', { ...data, checklist, progress });
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
    const userId = (req.session as any).user?.id;
    return this.documentService.uploadFile(+id, +typeId, file, userId);
  }

  // ── DELETE file ───────────────────────────────────────────────────────────
  @Delete('documents/file/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    return this.documentService.deleteFile(+fileId);
  }

  // ── DOWNLOAD file ─────────────────────────────────────────────────────────
  @Get('documents/file/:fileId/download')
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const filePath = await this.documentService.getFilePath(+fileId);
    return res.download(filePath);
  }
}
