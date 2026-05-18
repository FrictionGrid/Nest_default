import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectType } from '../../database/entities/project_type.entity';
import { CreateIncomingProjectDto } from '../dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from '../dto/update-incoming_project.dto';

@Injectable()
export class IncomingProjectService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly repo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectType)
    private readonly typeRepo: Repository<ProjectType>,
  ) {}

  findAll() {
    return this.repo.find({ order: { created_at: 'ASC' }, relations: ['types'] });
  }

  async create(dto: CreateIncomingProjectDto) {
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
    return project;
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateIncomingProjectDto) {
    const { type_ids, ...data } = dto;
    const project = await this.repo.findOne({ where: { id }, relations: ['types'] });
    if (!project) return null;

    Object.assign(project, data);
    if (type_ids !== undefined) {
      project.types = type_ids.length > 0
        ? await this.typeRepo.findBy({ id: In(type_ids) })
        : [];
    }
    return this.repo.save(project);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    await this.renumberItems();
  }

  private async renumberItems(): Promise<void> {
    const all = await this.repo.find({ order: { created_at: 'ASC' } });
    all.forEach((p, i) => { p.item = i + 1; });
    if (all.length > 0) await this.repo.save(all);
  }
}
