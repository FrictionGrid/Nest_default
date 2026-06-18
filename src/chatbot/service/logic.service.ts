import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { Team } from '../../database/entities/team.entity';
import { UsersTeam } from '../../database/entities/users_team.entity';
import { PaymentInstallment } from '../../database/entities/payment_installment.entity';

export interface BotResponse {
  reply: string;
  quick: string[];
}
// fix logic no ai
@Injectable()
export class LogicService {
  constructor(
    @InjectRepository(ProjectIncoming) private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(TaskTeam) private readonly taskRepo: Repository<TaskTeam>,
    @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    @InjectRepository(UsersTeam) private readonly usersTeamRepo: Repository<UsersTeam>,
    @InjectRepository(PaymentInstallment) private readonly paymentRepo: Repository<PaymentInstallment>,
  ) {}

  async handleIntent(intent: string): Promise<BotResponse> {
    switch (intent) {
      case 'project_overview': return this.projectOverview();
      case 'task_status':      return this.taskStatus();
      case 'team_info':        return this.teamInfo();
      case 'payment_info':     return this.paymentInfo();
      case 'help':             return this.help();
      default:                 return { reply: 'ไม่พบข้อมูลครับ', quick: [] };
    }
  }

  private async projectOverview(): Promise<BotResponse> {
    const projects = await this.projectRepo.find({ select: ['id', 'status'] });
    const total      = projects.length;
    const inProgress = projects.filter(p => p.status === 'in_progress').length;
    const delayed    = projects.filter(p => p.status === 'delayed').length;
    const completed  = projects.filter(p => p.status === 'completed').length;

    return {
      reply: `สรุปภาพรวมโปรเจค (ข้อมูลจริงจากระบบ):<br>
• โปรเจคทั้งหมด: <strong>${total} โปรเจค</strong><br>
• กำลังดำเนินงาน: <strong>${inProgress} โปรเจค</strong><br>
• ล่าช้า: <strong style="color:#c0392b;">${delayed} โปรเจค</strong><br>
• เสร็จสิ้นแล้ว: <strong>${completed} โปรเจค</strong><br><br>
ดูรายละเอียดได้ที่ <a href="/overview-project" style="color:var(--accent);">Overview Project</a>`,
      quick: ['สถานะงาน', 'ทีมทั้งหมด', 'การชำระเงิน'],
    };
  }

  private async taskStatus(): Promise<BotResponse> {
    const tasks = await this.taskRepo.find({ select: ['id', 'status'] });
    const total      = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const problem    = tasks.filter(t => t.status === 'problem').length;
    const completed  = tasks.filter(t => t.status === 'completed').length;
    const replanned  = tasks.filter(t => t.status === 'replanned').length;

    return {
      reply: `สรุปสถานะงานล่าสุด (ข้อมูลจริงจากระบบ):<br>
• งานทั้งหมด: <strong>${total} รายการ</strong><br>
• กำลังทำ: <strong>${inProgress} รายการ</strong><br>
• มีปัญหา: <strong style="color:#c0392b;">${problem} รายการ</strong><br>
• วางแผนใหม่: <strong>${replanned} รายการ</strong><br>
• เสร็จแล้ว: <strong>${completed} รายการ</strong><br><br>
ดูได้ที่ <a href="/dashboard-team" style="color:var(--accent);">Dashboard Team</a>`,
      quick: ['โปรเจคทั้งหมด', 'ทีมทั้งหมด', 'การชำระเงิน'],
    };
  }

  private async teamInfo(): Promise<BotResponse> {
    const teams = await this.teamRepo.find();
    const rows = await Promise.all(
      teams.map(async t => {
        const count = await this.usersTeamRepo.count({ where: { team_id: t.id } });
        return `• ${t.name} — <strong>${count} คน</strong>`;
      }),
    );

    return {
      reply: `ข้อมูลทีม (ข้อมูลจริงจากระบบ):<br>
ทีมทั้งหมด: <strong>${teams.length} ทีม</strong><br>
${rows.join('<br>')}<br><br>
จัดการทีมได้ที่ <a href="/user-management" style="color:var(--accent);">User Management</a>`,
      quick: ['สถานะงาน', 'โปรเจคทั้งหมด'],
    };
  }

  private async paymentInfo(): Promise<BotResponse> {
    const payments = await this.paymentRepo.find({ select: ['id', 'status', 'amount'] });
    const paid     = payments.filter(p => p.status === 'paid');
    const pending  = payments.filter(p => p.status === 'pending');
    const upcoming = payments.filter(p => p.status === 'upcoming');
    const sum = (arr: typeof payments) =>
      arr.reduce((acc, p) => acc + Number(p.amount ?? 0), 0).toLocaleString('th-TH');

    return {
      reply: `สรุปการชำระเงิน (ข้อมูลจริงจากระบบ):<br>
• ชำระแล้ว: <strong>${paid.length} รายการ</strong> (${sum(paid)} บาท)<br>
• รอชำระ: <strong style="color:#e67e22;">${pending.length} รายการ</strong> (${sum(pending)} บาท)<br>
• ยังไม่ถึงกำหนด: <strong>${upcoming.length} รายการ</strong> (${sum(upcoming)} บาท)<br><br>
ดูรายละเอียดที่ <a href="/payment" style="color:var(--accent);">Payment</a>`,
      quick: ['โปรเจคทั้งหมด', 'สถานะงาน'],
    };
  }

  private help(): BotResponse {
    return {
      reply: `เมนูหลักของระบบมีดังนี้:<br>
• <strong>Overview Project</strong> — ภาพรวมโปรเจคทั้งหมด<br>
• <strong>Incoming Project</strong> — รับโปรเจคใหม่<br>
• <strong>Manage Project</strong> — จัดการโปรเจค<br>
• <strong>Dashboard Team</strong> — ติดตามงานทีม<br>
• <strong>Timeline</strong> — ดู Gantt chart<br>
• <strong>Payment</strong> — จัดการการชำระเงิน<br>
• <strong>Activity Log</strong> — ประวัติการใช้งาน<br><br>
ถามเรื่องอื่น ๆ ได้เลยครับ!`,
      quick: ['โปรเจคทั้งหมด', 'สถานะงาน', 'ทีมทั้งหมด', 'การชำระเงิน'],
    };
  }
}
