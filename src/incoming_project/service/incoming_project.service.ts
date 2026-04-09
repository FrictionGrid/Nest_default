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
    return this.repo.find({ order: { item: 'ASC', id: 'ASC' }, relations: ['types'] });
  }

  async create(dto: CreateIncomingProjectDto) {
    const { type_ids, ...data } = dto;
    const project = this.repo.create(data);
    if (type_ids && type_ids.length > 0) {
      project.types = await this.typeRepo.findBy({ id: In(type_ids) });
    }
    return this.repo.save(project);
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
  }
}
