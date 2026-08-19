import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OvertimeApprovalStatus, OvertimeRequest } from '../database/entities/overtime_request.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

export interface ActingUser {
  id: number;
  role: string;
}

@Injectable()
export class OtApprovalService {
  constructor(
    @InjectRepository(OvertimeRequest)
    private readonly repo: Repository<OvertimeRequest>,
    @InjectRepository(UsersTeam)
    private readonly usersTeamRepo: Repository<UsersTeam>,
  ) {}

  getPageMeta() {
    return { pageTitle: 'OT Approve', pageSubtitle: 'Overtime approval queue' };
  }

  private async teamIdsOf(userId: number): Promise<number[]> {
    const rows = await this.usersTeamRepo.find({ where: { user_id: userId } });
    return rows.map((r) => r.team_id);
  }

  async getQueue(actor: ActingUser) {
    let rows: OvertimeRequest[];

    if (actor.role === 'adminsystem') {
      // adminsystem เห็นคำขอที่รออนุมัติทั้งขั้น 1 และขั้น 2 ของทุกทีม (สิทธิ์สูงสุด กำกับดูแลทั้งระบบ)
      rows = await this.repo.find({
        where: [
          { approval_status: OvertimeApprovalStatus.PENDING_LEVEL1 },
          { approval_status: OvertimeApprovalStatus.PENDING_LEVEL2 },
        ],
        relations: ['user', 'project'],
        order: { ot_date: 'ASC' },
      });
    } else if (actor.role === 'manager') {
      // ผู้จัดการเห็นคำขอที่รออนุมัติขั้น 2 ทั้งหมด ไม่จำกัดทีม
      rows = await this.repo.find({
        where: { approval_status: OvertimeApprovalStatus.PENDING_LEVEL2 },
        relations: ['user', 'project'],
        order: { ot_date: 'ASC' },
      });
    } else if (actor.role === 'head_engineer') {
      // หัวหน้าทีมเห็นเฉพาะคำขอขั้น 1 ของคนในทีมตัวเอง (ผูกผ่าน user_teams)
      const teamIds = await this.teamIdsOf(actor.id);
      if (teamIds.length === 0) return [];
      const memberRows = await this.usersTeamRepo.find({ where: { team_id: In(teamIds) } });
      const memberUserIds = [...new Set(memberRows.map((r) => r.user_id))];
      if (memberUserIds.length === 0) return [];
      rows = await this.repo.find({
        where: { approval_status: OvertimeApprovalStatus.PENDING_LEVEL1, user_id: In(memberUserIds) },
        relations: ['user', 'project'],
        order: { ot_date: 'ASC' },
      });
    } else {
      throw new ForbiddenException('บทบาทนี้ไม่มีสิทธิ์อนุมัติ OT');
    }

    return rows.map((r) => this.toView(r));
  }

  approve(actor: ActingUser, id: number) {
    return this.decide(actor, id, 'approve');
  }

  reject(actor: ActingUser, id: number) {
    return this.decide(actor, id, 'reject');
  }

  private async decide(actor: ActingUser, id: number, action: 'approve' | 'reject') {
    const req = await this.repo.findOne({ where: { id }, relations: ['user', 'project'] });
    if (!req) throw new BadRequestException('ไม่พบคำขอ OT นี้');

    if (req.approval_status === OvertimeApprovalStatus.PENDING_LEVEL1) {
      if (actor.role !== 'head_engineer' && actor.role !== 'adminsystem') {
        throw new ForbiddenException('ต้องเป็นหัวหน้างานของทีมนี้เท่านั้น');
      }
      if (actor.role === 'head_engineer') {
        const [approverTeamIds, requesterTeamIds] = await Promise.all([
          this.teamIdsOf(actor.id),
          req.user_id ? this.teamIdsOf(req.user_id) : Promise.resolve([]),
        ]);
        const sharesTeam = approverTeamIds.some((t) => requesterTeamIds.includes(t));
        if (!sharesTeam) throw new ForbiddenException('คุณไม่มีสิทธิ์อนุมัติคำขอของทีมนี้');
      }

      if (action === 'approve') {
        req.supervisor_approved_at = new Date();
        req.approval_status = OvertimeApprovalStatus.PENDING_LEVEL2;
      } else {
        req.approval_status = OvertimeApprovalStatus.REJECTED;
      }
    } else if (req.approval_status === OvertimeApprovalStatus.PENDING_LEVEL2) {
      if (actor.role !== 'manager' && actor.role !== 'adminsystem') throw new ForbiddenException('ต้องเป็นผู้จัดการเท่านั้น');

      if (action === 'approve') {
        req.manager_approved_at = new Date();
        req.approval_status = OvertimeApprovalStatus.APPROVED;
      } else {
        req.approval_status = OvertimeApprovalStatus.REJECTED;
      }
    } else {
      throw new BadRequestException('คำขอนี้ถูกดำเนินการไปแล้ว');
    }

    const saved = await this.repo.save(req);
    return this.toView(saved);
  }

  private toView(r: OvertimeRequest) {
    return {
      id: r.id,
      userId: r.user_id,
      userName: r.user?.display_name || r.user?.username || null,
      projectId: r.project_id,
      projectName: r.project?.project_name ?? null,
      customerName: r.customer_name,
      otDate: r.ot_date,
      startTime: r.start_time,
      endTime: r.end_time,
      hours: Number(r.total_hours),
      otType: r.ot_type,
      reason: r.reason,
      status: r.approval_status,
      supervisorApprovedAt: r.supervisor_approved_at,
      managerApprovedAt: r.manager_approved_at,
    };
  }
}
