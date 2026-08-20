import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectMain } from '../../database/entities/project_main.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { ProjectType } from '../../database/entities/project_type.entity';
import { ProjectTeam, ProjectTeamStatus } from '../../database/entities/project_team.entity';
import { CreateIncomingProjectDto } from '../dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from '../dto/update-incoming_project.dto';
import { ActivityLogService } from '../../activity_log/service/activity_log.service';

@Injectable()
export class IncomingProjectService {
  constructor(
    @InjectRepository(ProjectMain)
    private readonly repo: Repository<ProjectMain>,
    @InjectRepository(ProjectIncoming)
    private readonly poRepo: Repository<ProjectIncoming>,
    @InjectRepository(ProjectType)
    private readonly typeRepo: Repository<ProjectType>,
    @InjectRepository(ProjectTeam)
    private readonly projectTeamRepo: Repository<ProjectTeam>,
    private readonly logService: ActivityLogService,
  ) {}

  // ดึงจาก DB ที่ประกาศมาใช้ พร้อมสรุป PO ของแต่ละโปรเจค
  async findAll() {
    const projects = await this.repo.find({ order: { created_at: 'ASC', id: 'ASC' }, relations: ['types'] });
    const pos = await this.poRepo.find();

    const poMap = new Map<number, ProjectIncoming[]>();
    for (const po of pos) {
      if (!poMap.has(po.project_main_id)) poMap.set(po.project_main_id, []);
      poMap.get(po.project_main_id)!.push(po);
    }

    return projects.map((p) => {
      const projectPos = poMap.get(p.id) ?? [];
      return {
        ...p,
        pos: projectPos,
        po_total: projectPos.reduce((sum, po) => sum + (Number(po.po_value) || 0), 0),
        po_count: projectPos.length,
      };
    });
  }

  async create(dto: CreateIncomingProjectDto, userId?: number, userRole?: string) {
    const { type_ids, item: _item, pos, ...data } = dto; // ตั้งชื่อตัวเเปรตาม dto เเละ สร้างตัวเเปรชื่อ dto , type id ต้องหน้าบ้านจะวิ่ง id มา
    const project = this.repo.create({ ...data, item: 0 }); // item ให้เป็น 0 ไว้ก่อน
    if (type_ids && type_ids.length > 0) { // เอา type มาเก็บ
      project.types = await this.typeRepo.findBy({ id: In(type_ids) }); //เอาทุก id ที่ส่งมาไปหา type_id
    }
    await this.repo.save(project);

    if (pos && pos.length > 0) {
      const poRows = pos.map((po) => this.poRepo.create({
        project_main_id: project.id,
        po_no: po.po_no,
        po_value: po.po_value,
        ...(po.created_at ? { created_at: new Date(po.created_at) } : {}),
      }));
      await this.poRepo.save(poRows);
    }

    await this.renumberItems(); // เรียกฟังชั่นนี้มาใช้
    // ฟังชั่น log ยังไม่ต้องดู
    await this.logService.logIncomingProject('create', project.id, { userId, userRole, projectName: project.project_name });
    return project;
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async update(id: number, dto: UpdateIncomingProjectDto, userId?: number, userRole?: string) {
    const { type_ids, pos, ...data } = dto;
    const project = await this.repo.findOne({ where: { id }, relations: ['types'] }); // วิ่งหาไอดี  project พร้อมวิ่งหาตาราง type
    if (!project) return null;
    Object.assign(project, data); // คำสั่งเอาไปเเทนที่
    if (type_ids !== undefined) { // 3 กรณี 1 ไม่เเตะ 2 ลบหมด 3 เปลี่ยน
      project.types = type_ids.length > 0
        ? await this.typeRepo.findBy({ id: In(type_ids) })
        : [];
    }
    const saved = await this.repo.save(project);

    if (pos !== undefined) {
      const existing = await this.poRepo.find({ where: { project_main_id: id } });
      const keepIds = new Set(pos.filter((po) => po.id).map((po) => po.id));
      const toDelete = existing.filter((po) => !keepIds.has(po.id));
      if (toDelete.length > 0) await this.poRepo.remove(toDelete);

      const existingById = new Map(existing.map((po) => [po.id, po]));
      const toSave = pos.map((po) => {
        if (po.id && existingById.has(po.id)) {
          const row = existingById.get(po.id)!;
          row.po_no = po.po_no ?? row.po_no;
          row.po_value = po.po_value as any;
          if (po.created_at) row.created_at = new Date(po.created_at);
          return row;
        }
        return this.poRepo.create({
          project_main_id: id,
          po_no: po.po_no,
          po_value: po.po_value,
          ...(po.created_at ? { created_at: new Date(po.created_at) } : {}),
        });
      });
      if (toSave.length > 0) await this.poRepo.save(toSave);
    }

    await this.renumberItems();
    await this.logService.logIncomingProject('update', id, { userId, userRole, projectName: project.project_name });
    return saved;
  }

  async complete(id: number, userId?: number, userRole?: string) {
    const teams = await this.projectTeamRepo.find({
      where: { project_id: id },
      relations: ['team'],
    });
    const notDone = teams.filter((t) => t.status !== ProjectTeamStatus.COMPLETED);
    if (notDone.length > 0) {
      const names = notDone.map((t) => t.team?.name ?? `Team #${t.team_id}`).join(', ');
      throw new BadRequestException(`ยังปิดโปรเจกต์ไม่ได้ เนื่องจากทีม "${names}" ยังไม่เสร็จ`);
    }
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
