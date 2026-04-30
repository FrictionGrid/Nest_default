import { Controller, Get, Post, Body, Param, Delete, Put, Render, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
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
  async index(@Req() req: Request) {
    const sessionUser = (req.session as any).user;
    const isScoped    = sessionUser?.role === 'head_engineer';
    const userId      = sessionUser?.id;

    const [projects, projectList, teamList] = await Promise.all([
      isScoped ? this.manageProjectService.findAllScoped(userId) : this.manageProjectService.findAll(),
      isScoped ? this.manageProjectService.findProjectsScoped(userId) : this.manageProjectService.findAllProjects(),
      isScoped ? this.manageProjectService.findTeamsByUser(userId) : this.manageProjectService.findAllTeams(),
    ]);
    return { pageTitle: 'Manage Project', pageSubtitle: 'Assign and manage project teams', projects, projectList, teamList };
  }

  @Post('api')
  create(@Body() dto: CreateManageProjectDto) {
    return this.manageProjectService.create(dto);
  }

  @Put('api/:id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateManageProjectDto) {
    const sessionUser = (req.session as any).user;
    if (sessionUser?.role === 'head_engineer') {
      await this.manageProjectService.assertRowInUserTeam(+id, sessionUser.id);
    }
    return this.manageProjectService.update(+id, dto);
  }

  @Put('api/:id/complete')
  async complete(@Req() req: Request, @Param('id') id: string) {
    const sessionUser = (req.session as any).user;
    if (sessionUser?.role === 'head_engineer') {
      await this.manageProjectService.assertRowInUserTeam(+id, sessionUser.id);
    }
    return this.manageProjectService.complete(+id);
  }

  @Delete('api/:id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const sessionUser = (req.session as any).user;
    if (sessionUser?.role === 'head_engineer') {
      await this.manageProjectService.assertRowInUserTeam(+id, sessionUser.id);
    }
    return this.manageProjectService.remove(+id);
  }
}
