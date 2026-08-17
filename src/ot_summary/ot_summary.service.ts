import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import * as path from 'path';
import { readFile } from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import * as fontkit from '@pdf-lib/fontkit';
import { OvertimeApprovalStatus, OvertimeRequest } from '../database/entities/overtime_request.entity';
import { UsersTeam } from '../database/entities/users_team.entity';
import { EmployeeProfile } from '../database/entities/employee_profile.entity';

const OT_FORM_TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'ot', 'overtime_approval_request_form.pdf');
const THAI_FONT_PATH = path.join(process.cwd(), 'templates', 'fonts', 'NotoSansThai-Regular.ttf');

@Injectable()
export class OtSummaryService {
  constructor(
    @InjectRepository(OvertimeRequest)
    private readonly repo: Repository<OvertimeRequest>,
    @InjectRepository(UsersTeam)
    private readonly usersTeamRepo: Repository<UsersTeam>,
    @InjectRepository(EmployeeProfile)
    private readonly employeeProfileRepo: Repository<EmployeeProfile>,
  ) {}

  getSummaryPageMeta() {
    return { pageTitle: 'OT Summary', pageSubtitle: 'Overtime fully approved for the current cycle' };
  }

  getDocumentPageMeta() {
    return { pageTitle: 'OT Document', pageSubtitle: 'OT Documents' };
  }

  private formatDate(d: Date | string): string {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private formatTime(t: string): string {
    return t.slice(0, 5);
  }

  async generateOtRequestForm(requestId: number): Promise<Buffer> {
    const request = await this.repo.findOne({
      where: { id: requestId },
      relations: ['project', 'user'],
    });
    if (!request) throw new NotFoundException(`Overtime request ${requestId} not found`);

    const profile = request.user_id
      ? await this.employeeProfileRepo.findOne({ where: { user_id: request.user_id } })
      : null;

    // employee_profiles has no row until the user saves their Profile page — fall back to their account name
    const fallbackName = request.user?.display_name || request.user?.username || '';
    const [fallbackFirst = '', ...fallbackLastParts] = fallbackName.split(' ').filter(Boolean);
    const fallbackLast = fallbackLastParts.join(' ');

    const templateBytes = await readFile(OT_FORM_TEMPLATE_PATH);
    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const thaiFontBytes = await readFile(THAI_FONT_PATH);
    const thaiFont = await pdfDoc.embedFont(thaiFontBytes, { subset: true });
    const form = pdfDoc.getForm();

    const setText = (fieldName: string, value: string) => {
      try {
        form.getTextField(fieldName).setText(value ?? '');
      } catch {
        // field not present in template — skip
      }
    };

    setText('First Name', profile?.first_name || fallbackFirst);
    setText('Last Name', profile?.last_name || fallbackLast);
    setText('Title', profile?.employee_title ?? '');
    setText('Department', profile?.employee_department ?? '');
    setText('Number of Overtime Hours Requested', String(Number(request.total_hours)));
    setText('Dates OT Will be Worked', `${this.formatDate(request.ot_date)} (${this.formatTime(request.start_time)}–${this.formatTime(request.end_time)})`);
    setText('Project Name', request.project?.project_name ?? '');
    setText('Customer name', request.customer_name ?? '');
    setText('Purpose/Justification for the OT Requested', request.reason ?? '');
    setText('Date', this.formatDate(request.created_at));

    form.updateFieldAppearances(thaiFont);
    form.flatten();

    // Supervisor/Manager approval block has no AcroForm fields in the template — draw directly on the page.
    const page = pdfDoc.getPage(0);
    if (request.supervisor_approved_at) {
      page.drawText('X', { x: 208, y: 226, size: 12, font: thaiFont });
      page.drawText(this.formatDate(request.supervisor_approved_at), { x: 415, y: 230, size: 9, font: thaiFont });
    } else if (request.approval_status === OvertimeApprovalStatus.REJECTED) {
      page.drawText('X', { x: 293.5, y: 226, size: 12, font: thaiFont });
      page.drawText(this.formatDate(request.updated_at), { x: 415, y: 224, size: 9, font: thaiFont });
    }

    if (request.manager_approved_at) {
      page.drawText(this.formatDate(request.manager_approved_at), { x: 357, y: 197, size: 9, font: thaiFont });
    } else if (request.approval_status === OvertimeApprovalStatus.REJECTED && request.supervisor_approved_at) {
      page.drawText('NOT APPROVED', { x: 231, y: 190, size: 9, font: thaiFont });
      page.drawText(this.formatDate(request.updated_at), { x: 357, y: 190, size: 9, font: thaiFont });
    }

    const filledBytes = await pdfDoc.save();
    return Buffer.from(filledBytes);
  }

  // ตัดรอบทุกวันที่ 20: วันนี้ <= 20 -> รอบคือ (เดือนก่อน 21) ถึง (เดือนนี้ 20)
  // วันนี้ > 20 -> รอบคือ (เดือนนี้ 21) ถึง (เดือนหน้า 20)
  private currentCycle(now = new Date()) {
    const cutoff = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > 20 ? 1 : 0), 20);
    const start = new Date(cutoff.getFullYear(), cutoff.getMonth() - 1, 21);
    return { startDate: start, cutoffDate: cutoff, month: cutoff.getMonth() + 1, year: cutoff.getFullYear() };
  }

  private toDateOnly(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  private async teamNamesByUser(userIds: number[]): Promise<Map<number, string>> {
    if (userIds.length === 0) return new Map();
    const memberships = await this.usersTeamRepo.find({ where: { user_id: In(userIds) }, relations: ['team'] });
    const map = new Map<number, string>();
    for (const m of memberships) {
      if (!map.has(m.user_id) && m.team) map.set(m.user_id, m.team.name);
    }
    return map;
  }

  async getSummaryRows() {
    const cycle = this.currentCycle();
    const rows = await this.repo.find({
      where: {
        approval_status: OvertimeApprovalStatus.APPROVED,
        ot_date: Between(this.toDateOnly(cycle.startDate) as unknown as Date, this.toDateOnly(cycle.cutoffDate) as unknown as Date),
      },
      relations: ['user', 'project'],
      order: { ot_date: 'DESC' },
    });

    const userIds = [...new Set(rows.map((r) => r.user_id).filter((id): id is number => id != null))];
    const teamsByUser = await this.teamNamesByUser(userIds);

    return {
      cycle: {
        month: cycle.month,
        year: cycle.year,
        cutoffDate: this.toDateOnly(cycle.cutoffDate),
      },
      rows: rows.map((r) => ({
        id: r.id,
        userName: r.user?.display_name || r.user?.username || null,
        teamName: r.user_id ? teamsByUser.get(r.user_id) ?? null : null,
        projectName: r.project?.project_name ?? null,
        customerName: r.customer_name,
        otDate: r.ot_date,
        hours: Number(r.total_hours),
        otType: r.ot_type,
      })),
    };
  }
}
