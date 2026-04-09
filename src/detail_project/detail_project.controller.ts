import { Controller, Get, Param, Render } from '@nestjs/common';
import { DetailProjectService } from './detail_project.service';

@Controller('detail-project')
export class DetailProjectController {
  constructor(private readonly detailProjectService: DetailProjectService) {}

  @Get(':id')
  @Render('detail_project')
  async findOne(@Param('id') id: string) {
    return this.detailProjectService.findById(+id);
  }
}
