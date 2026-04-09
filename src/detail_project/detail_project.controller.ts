import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DetailProjectService } from './detail_project.service';
import { CreateDetailProjectDto } from './dto/create-detail_project.dto';
import { UpdateDetailProjectDto } from './dto/update-detail_project.dto';

@Controller('detail-project')
export class DetailProjectController {
  constructor(private readonly detailProjectService: DetailProjectService) {}

  @Post()
  create(@Body() createDetailProjectDto: CreateDetailProjectDto) {
    return this.detailProjectService.create(createDetailProjectDto);
  }

  @Get()
  findAll() {
    return this.detailProjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.detailProjectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDetailProjectDto: UpdateDetailProjectDto) {
    return this.detailProjectService.update(+id, updateDetailProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.detailProjectService.remove(+id);
  }
}
