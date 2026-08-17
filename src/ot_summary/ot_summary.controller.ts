import { Controller, Get, Param, ParseIntPipe, Render, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OtSummaryService } from './ot_summary.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class OtSummaryController {
  constructor(private readonly otSummaryService: OtSummaryService) {}

  @Get('ot-summary')
  @Render('ot_summary')
  otSummary() {
    return this.otSummaryService.getSummaryPageMeta();
  }

  @Get('ot-summary/api/rows')
  async summaryRows() {
    return this.otSummaryService.getSummaryRows();
  }

  @Get('ot-document')
  @Render('ot_document')
  otDocument() {
    return this.otSummaryService.getDocumentPageMeta();
  }

  @Get('ot-document/:requestId/download')
  async downloadOtForm(@Param('requestId', ParseIntPipe) requestId: number, @Res() res: Response) {
    const pdfBuffer = await this.otSummaryService.generateOtRequestForm(requestId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="overtime_request_${requestId}.pdf"`);
    res.send(pdfBuffer);
  }
}
