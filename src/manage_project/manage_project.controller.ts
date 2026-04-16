import { Controller, Get, Post, Body, Param, Delete, Put, Render, UseGuards } from '@nestjs/common';
import { ManageProjectService } from './service/manage_project.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateManageProjectDto } from './dto/create-manage_project.dto';
import { UpdateManageProjectDto } from './dto/update-manage_project.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('manage-project')
export class ManageProjectController {
  constructor(private readonly manageProjectService: ManageProjectService) {}

  @Get()
  @Render('manage_project')
  async index() {
    const [projects, projectList, teamList] = await Promise.all([
      this.manageProjectService.findAll(),
      this.manageProjectService.findAllProjects(),
      this.manageProjectService.findAllTeams(),
    ]);
    return { pageTitle: 'Manage Project', projects, projectList, teamList };
  }

  @Post('api')
  create(@Body() dto: CreateManageProjectDto) {
    return this.manageProjectService.create(dto);
  }

  @Put('api/:id')
  update(@Param('id') id: string, @Body() dto: UpdateManageProjectDto) {
    return this.manageProjectService.update(+id, dto);
  }

  @Put('api/:id/complete')
  complete(@Param('id') id: string) {
    return this.manageProjectService.complete(+id);
  }

  @Delete('api/:id')
  remove(@Param('id') id: string) {
    return this.manageProjectService.remove(+id);
  }
}
