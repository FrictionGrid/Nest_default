import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IncomingProjectService } from './incoming_project.service';
import { CreateIncomingProjectDto } from './dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from './dto/update-incoming_project.dto';

@Controller('incoming-project')
export class IncomingProjectController {
  constructor(private readonly incomingProjectService: IncomingProjectService) {}

  @Post()
  create(@Body() createIncomingProjectDto: CreateIncomingProjectDto) {
    return this.incomingProjectService.create(createIncomingProjectDto);
  }

  @Get()
  findAll() {
    return this.incomingProjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incomingProjectService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncomingProjectDto: UpdateIncomingProjectDto) {
    return this.incomingProjectService.update(+id, updateIncomingProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incomingProjectService.remove(+id);
  }
}
