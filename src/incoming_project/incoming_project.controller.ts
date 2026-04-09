import { Controller, Get, Post, Body, Param, Delete, Put, Render } from '@nestjs/common';
import { IncomingProjectService } from './service/incoming_project.service';
import { CreateIncomingProjectDto } from './dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from './dto/update-incoming_project.dto';

@Controller('incoming-project')
export class IncomingProjectController {
  constructor(private readonly incomingProjectService: IncomingProjectService) {}

  @Get()
  @Render('incoming_project')
  index() {
    return { pageTitle: 'Incoming Project', pageSubtitle: 'List of incoming projects' };
  }

  @Get('api/projects')
  findAll() {
    return this.incomingProjectService.findAll();
  }

  @Post('api/projects')
  create(@Body() dto: CreateIncomingProjectDto) {
    return this.incomingProjectService.create(dto);
  }

  @Put('api/projects/:id')
  update(@Param('id') id: string, @Body() dto: UpdateIncomingProjectDto) {
    return this.incomingProjectService.update(+id, dto);
  }

  @Delete('api/projects/:id')
  remove(@Param('id') id: string) {
    return this.incomingProjectService.remove(+id);
  }
}
