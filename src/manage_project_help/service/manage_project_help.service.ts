import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { CreateDayAdjustmentDto, DayAdjustmentFactorType } from '../dto/create-day-adjustment.dto';
import { UpdateBudgetAllocationDto } from '../dto/update-budget-allocation.dto';

export interface DayAdjustment {
  id: number;
  project_id: number;
  factor_type: DayAdjustmentFactorType;
  note: string;
  days_delta: number;
  created_at: Date;
}

export interface BudgetAllocation {
  labor_percent: number;
  material_percent: number;
  operating_percent: number;
  profit_percent: number;
}

const FACTOR_LABELS: Record<DayAdjustmentFactorType, string> = {
  internal_staff: 'ใช้คนในองค์กร',
  external_staff: 'ใช้คนนอก / outsource',
  requirement_change: 'Requirement เพิ่มเติม',
  emergency: 'ปัญหาฉุกเฉิน',
  other: 'ปัจจัยอื่น ๆ',
};

const EMPTY_BUDGET: BudgetAllocation = {
  labor_percent: 0,
  material_percent: 0,
  operating_percent: 0,
  profit_percent: 0,
};

// เวอร์ชัน prototype: เก็บค่าที่ยังไม่มีตาราง DB ไว้ใน memory ของ service
// (รีเซ็ตกลับเป็นค่าเริ่มต้นทุกครั้งที่ restart server)
@Injectable()
export class ManageProjectHelpService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
  ) {}

  private dayRate = 5000;
  private adjustments = new Map<number, DayAdjustment[]>();
  private budgetAllocations = new Map<number, BudgetAllocation>();
  private nextAdjustmentId = 1;

  async findAllProjects() {
    const projects = await this.projectRepo.find({ order: { item: 'ASC', id: 'ASC' } });
    return projects.map((p) => ({
      id: p.id,
      item: p.item ?? '—',
      project_name: p.project_name,
      sales_name: p.sales_name || '—',
      region: p.region || '—',
      status: p.status,
      poValueFormatted: this.formatMoney(p.po_value),
    }));
  }

  getDayRate() {
    return this.dayRate;
  }

  setDayRate(rate: number) {
    const parsed = Number(rate);
    if (Number.isFinite(parsed) && parsed > 0) {
      this.dayRate = parsed;
    }
    return { day_rate: this.dayRate };
  }

  async findProjectDetail(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    const poValue = Number(project.po_value) || 0;
    const baseDays = this.dayRate > 0 ? Math.ceil(poValue / this.dayRate) : 0;

    const rawAdjustments = (this.adjustments.get(id) ?? []).slice().sort((a, b) => a.id - b.id);
    const adjustments = rawAdjustments.map((a) => ({
      ...a,
      factorLabel: FACTOR_LABELS[a.factor_type] ?? a.factor_type,
    }));
    const adjustmentsTotal = adjustments.reduce((sum, a) => sum + a.days_delta, 0);
    const totalDays = baseDays + adjustmentsTotal;

    const budget = this.budgetAllocations.get(id) ?? { ...EMPTY_BUDGET };
    const categories = [
      { key: 'labor', label: 'ต้นทุนคน (Labor Cost)', percent: budget.labor_percent },
      { key: 'material', label: 'ต้นทุนวัสดุ/อุปกรณ์ (Material Cost)', percent: budget.material_percent },
      { key: 'operating', label: 'ค่าใช้จ่ายดำเนินงาน (Operating Expense)', percent: budget.operating_percent },
      { key: 'profit', label: 'กำไร/สำรองความเสี่ยง (Profit/Contingency)', percent: budget.profit_percent },
    ].map((c) => ({
      ...c,
      amount: (poValue * (Number(c.percent) || 0)) / 100,
      amountFormatted: this.formatMoney((poValue * (Number(c.percent) || 0)) / 100),
    }));
    const percentSum = categories.reduce((sum, c) => sum + (Number(c.percent) || 0), 0);
    const amountSum = categories.reduce((sum, c) => sum + c.amount, 0);

    return {
      pageTitle: 'Manage Project Help',
      pageSubtitle: project.project_name,
      project: {
        id: project.id,
        project_name: project.project_name,
        po_value: poValue,
        poValueFormatted: this.formatMoney(project.po_value),
        status: project.status,
      },
      dayRate: this.dayRate,
      baseDays,
      adjustments,
      adjustmentsTotal,
      totalDays,
      factorOptions: (Object.keys(FACTOR_LABELS) as DayAdjustmentFactorType[]).map((value) => ({
        value,
        label: FACTOR_LABELS[value],
      })),
      budget: categories,
      percentSum,
      amountSum,
      amountSumFormatted: this.formatMoney(amountSum),
      remainingAmount: poValue - amountSum,
      remainingAmountFormatted: this.formatMoney(poValue - amountSum),
    };
  }

  addAdjustment(projectId: number, dto: CreateDayAdjustmentDto) {
    const list = this.adjustments.get(projectId) ?? [];
    const entry: DayAdjustment = {
      id: this.nextAdjustmentId++,
      project_id: projectId,
      factor_type: dto.factor_type,
      note: dto.note ?? '',
      days_delta: Number(dto.days_delta) || 0,
      created_at: new Date(),
    };
    list.push(entry);
    this.adjustments.set(projectId, list);
    return entry;
  }

  removeAdjustment(adjustmentId: number) {
    for (const [projectId, list] of this.adjustments.entries()) {
      const idx = list.findIndex((a) => a.id === adjustmentId);
      if (idx !== -1) {
        list.splice(idx, 1);
        this.adjustments.set(projectId, list);
        return { success: true };
      }
    }
    return { success: false };
  }

  upsertBudgetAllocation(projectId: number, dto: UpdateBudgetAllocationDto) {
    const allocation: BudgetAllocation = {
      labor_percent: Number(dto.labor_percent) || 0,
      material_percent: Number(dto.material_percent) || 0,
      operating_percent: Number(dto.operating_percent) || 0,
      profit_percent: Number(dto.profit_percent) || 0,
    };
    this.budgetAllocations.set(projectId, allocation);
    return allocation;
  }

  private formatMoney(value: number | null | undefined) {
    if (!value) return '฿0.00';
    return '฿' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 });
  }
}
