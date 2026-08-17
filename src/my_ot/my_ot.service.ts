import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OvertimeRequest, OvertimeType } from '../database/entities/overtime_request.entity';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';

export interface CreateOtRequestInput {
  project_id: number;
  customer_name: string;
  ot_date: string;
  start_time: string;
  end_time: string;
  ot_type: OvertimeType;
  reason: string;
}

function computeHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes <= 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 100) / 100;
}

@Injectable()
export class MyOtService {
  constructor(
    @InjectRepository(OvertimeRequest)  
    private readonly repo: Repository<OvertimeRequest>,
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
  ) {}

  async listProjects() {
    const projects = await this.projectRepo.find({ order: { project_name: 'ASC' } });
    return projects.map((p) => ({ id: p.id, name: p.project_name }));
  }

  async findMine(userId: number) {
    const rows = await this.repo.find({
      where: { user_id: userId },
      relations: ['project'],
      order: { ot_date: 'DESC' },
    });
    return rows.map((r) => this.toView(r));
  }

  async create(userId: number, input: CreateOtRequestInput) {
    const projectId = Number(input.project_id);
    const customerName = input.customer_name?.trim();
    const reason = input.reason?.trim();

    if (!projectId || !customerName || !input.ot_date || !input.start_time || !input.end_time || !reason) {
      throw new BadRequestException('กรุณากรอกข้อมูลให้ครบ');
    }
    if (!Object.values(OvertimeType).includes(input.ot_type)) {
      throw new BadRequestException('ประเภท OT ไม่ถูกต้อง');
    }

    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) throw new BadRequestException('ไม่พบโปรเจคที่เลือก');

    const total_hours = computeHours(input.start_time, input.end_time);

    const entity = this.repo.create({
      user_id: userId,
      project_id: projectId,
      customer_name: customerName,
      ot_date: input.ot_date as unknown as Date,
      start_time: input.start_time,
      end_time: input.end_time,
      total_hours,
      ot_type: input.ot_type,
      reason,
    });
    const saved = await this.repo.save(entity);
    saved.project = project;
    return this.toView(saved);
  }

  private toView(r: OvertimeRequest) {
    return {
      id: r.id,
      projectId: r.project_id,
      projectName: r.project?.project_name ?? null,
      customerName: r.customer_name,
      otDate: r.ot_date,
      startTime: this.formatTime(r.start_time),
      endTime: this.formatTime(r.end_time),
      hours: Number(r.total_hours),
      otType: r.ot_type,
      reason: r.reason,
      status: r.approval_status,
      supervisorApprovedAt: r.supervisor_approved_at,
      managerApprovedAt: r.manager_approved_at,
    };
  }

   private formatTime(t: string | null | undefined): string {
    if (!t) return '';
    // ตัดวินาทีออก เหลือ HH:mm เช่น "14:30:00" -> "14:30"
    return t.slice(0, 5);
  }

}
