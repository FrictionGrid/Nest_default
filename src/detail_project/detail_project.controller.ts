import { Controller, Get, Param, Render, UseGuards } from '@nestjs/common';
import { DetailProjectService } from './detail_project.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('detail-project')
export class DetailProjectController {
  constructor(private readonly detailProjectService: DetailProjectService) {}

  @Get(':id')
  @Render('detail_project')
  async findOne(@Param('id') id: string) {
    return this.detailProjectService.findById(+id);
  }
}
