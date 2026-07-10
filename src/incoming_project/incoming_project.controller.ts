import { Controller, Get, Post, Body, Param, Delete, Put, Render, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { IncomingProjectService } from './service/incoming_project.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateIncomingProjectDto } from './dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from './dto/update-incoming_project.dto';

@UseGuards(AuthGuard, RolesGuard) // สำหรับ logic permission
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
  create(@Req() req: Request, @Body() dto: CreateIncomingProjectDto) {
    const { id, role } = (req.session as any).user ?? {};
    return this.incomingProjectService.create(dto, id, role);
  }

  @Put('api/projects/:id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateIncomingProjectDto) {
    const { id: userId, role } = (req.session as any).user ?? {};
    return this.incomingProjectService.update(+id, dto, userId, role);
  }

  @Put('api/projects/:id/complete')
  complete(@Req() req: Request, @Param('id') id: string) {
    const { id: userId, role } = (req.session as any).user ?? {};
    return this.incomingProjectService.complete(+id, userId, role);
  }

  @Delete('api/projects/:id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const { id: userId, role } = (req.session as any).user ?? {};
    return this.incomingProjectService.remove(+id, userId, role);
  }
}
