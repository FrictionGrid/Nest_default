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
    const { type_ids, item: _item, ...data } = dto; // ตั้งชื่อตัวเเปรตาม dto เเละ สร้างตัวเเปรชื่อ dto , type id ต้องหน้าบ้านจะวิ่ง id มา
    if (data.po_no) { // อันนี้คือการเอามารวมชื่อกันตอนสร้าง
      data.project_name = `${data.project_name}_${data.po_no}`; 
    }
    const project = this.repo.create({ ...data, item: 0 }); // item ให้เป็น 0 ไว้ก่อน
    if (type_ids && type_ids.length > 0) { // เอา type มาเก็บ 
      project.types = await this.typeRepo.findBy({ id: In(type_ids) }); //เอาทุก id ที่ส่งมาไปหา type_id
    } 
    await this.repo.save(project); 
    await this.renumberItems(); // เรียกฟังชั่นนี้มาใช้
    // ฟังชั่น log ยังไม่ต้องดู
    await this.logService.logIncomingProject('create', project.id, { userId, userRole, projectName: project.project_name }); 
    return project;
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateIncomingProjectDto, userId?: number, userRole?: string) {
    const { type_ids, ...data } = dto;
    const project = await this.repo.findOne({ where: { id }, relations: ['types'] }); // วิ่งหาไอดี  project พร้อมวิ่งหาตาราง type
    if (!project) return null;
    Object.assign(project, data); // คำสั่งเอาไปเเทนที่
    if (type_ids !== undefined) { // 3 กรณี 1 ไม่เเตะ 2 ลบหมด 3 เปลี่ยน
      project.types = type_ids.length > 0
        ? await this.typeRepo.findBy({ id: In(type_ids) })
        : [];
    }
    const saved = await this.repo.save(project);
    await this.renumberItems();
    await this.logService.logIncomingProject('update', id, { userId, userRole, projectName: project.project_name });
    return saved;
  }

  async complete(id: number, userId?: number, userRole?: string) {
    await this.repo.update(id, { status: 'completed' });
    await this.logService.logIncomingProject('complete', id, { userId, userRole });
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
