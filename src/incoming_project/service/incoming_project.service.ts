import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectType } from '../../database/entities/project_type.entity';
import { CreateIncomingProjectDto } from '../dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from '../dto/update-incoming_project.dto';
import { ActivityLogService } from '../../activity_log/service/activity_log.service';

@Injectable()
export class IncomingProjectService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly repo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectType)
    private readonly typeRepo: Repository<ProjectType>,
    private readonly logService: ActivityLogService,
  ) {}
// ดึงจาก DB ที่ประกาศมาใช้
  findAll() {
    return this.repo.find({ order: { created_at: 'ASC', id: 'ASC' }, relations: ['types'] });
  }

  async create(dto: CreateIncomingProjectDto, userId?: number, userRole?: string) {
    const { type_ids, item: _item, ...data } = dto;
    if (data.po_no) {
      data.project_name = `${data.project_name}_${data.po_no}`;
    }
    const project = this.repo.create({ ...data, item: 0 });
    if (type_ids && type_ids.length > 0) {
      project.types = await this.typeRepo.findBy({ id: In(type_ids) });
    }
    await this.repo.save(project);
    await this.renumberItems();
    await this.logService.logIncomingProject('create', project.id, { userId, userRole, projectName: project.project_name });
    return project;
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateIncomingProjectDto, userId?: number, userRole?: string) {
    const { type_ids, ...data } = dto;
    const project = await this.repo.findOne({ where: { id }, relations: ['types'] });
    if (!project) return null;
    Object.assign(project, data);
    if (type_ids !== undefined) {
      project.types = type_ids.length > 0
        ? await this.typeRepo.findBy({ id: In(type_ids) })
        : [];
    }
    const saved = await this.repo.save(project);
    await this.renumberItems();
    await this.logService.logIncomingProject('update', id, { userId, userRole, projectName: project.project_name });
    return saved;
  }

  async remove(id: number, userId?: number, userRole?: string) {
    const project = await this.repo.findOne({ where: { id } });
    await this.logService.logIncomingProject('delete', id, { userId, userRole, projectName: project?.project_name });
    await this.repo.delete(id);
    await this.renumberItems();
  }

  private async renumberItems(): Promise<void> {
    const all = await this.repo.find({ order: { created_at: 'ASC', id: 'ASC' } });
    all.forEach((p, i) => { p.item = i + 1; });
    if (all.length > 0) await this.repo.save(all);
  }
}
