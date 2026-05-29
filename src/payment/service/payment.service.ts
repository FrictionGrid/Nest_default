import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { PaymentInstallment, InstallmentStatus } from '../../database/entities/payment_installment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(ProjectIncoming)
    private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(PaymentInstallment)
    private readonly installmentRepo: Repository<PaymentInstallment>,
  ) {}

  async getAllProjects(search?: string, status?: string, year?: number, month?: number, sale?: string) {
    let qb = this.projectRepo.createQueryBuilder('p').orderBy('p.created_at', 'DESC');
    
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (search)  { conditions.push('p.project_name ILIKE :s'); params.s = `%${search}%`; }
    if (status)  { conditions.push('p.status = :status');       params.status = status; }
    if (year)    { conditions.push('EXTRACT(YEAR  FROM p.created_at) = :year');  params.year  = year; }
    if (month)   { conditions.push('EXTRACT(MONTH FROM p.created_at) = :month'); params.month = month; }
    if (sale)    { conditions.push('p.sales_name = :sale');     params.sale = sale; }

    if (conditions.length) {
      qb = qb.where(conditions[0], params);
      for (let i = 1; i < conditions.length; i++) qb = qb.andWhere(conditions[i], params);
    }

    const projects = await qb.getMany();
    if (!projects.length) return [];

    const ids = projects.map(p => p.id);
    const insts = await this.installmentRepo
      .createQueryBuilder('i')
      .where('i.project_id IN (:...ids)', { ids })
      .orderBy('i.installment_no', 'ASC')
      .getMany();

    const instMap = new Map<number, PaymentInstallment[]>();
    insts.forEach(i => {
      if (!instMap.has(i.project_id)) instMap.set(i.project_id, []);
      instMap.get(i.project_id)!.push(i);
    });

    return projects.map(p => this.formatProject(p, instMap.get(p.id) ?? []));
  }

  async getProjectById(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) return null;

    const insts = await this.installmentRepo.find({
      where: { project_id: id },
      order: { installment_no: 'ASC' },
    });

    return this.formatProject(project, insts);
  }

  private formatProject(p: ProjectIncoming, insts: PaymentInstallment[]) {
    const installments = insts.map(i => ({
      id: i.id,
      installment_no: i.installment_no,
      due_date: i.due_date ? String(i.due_date).slice(0, 10) : null,
      amount: Number(i.amount) || 0,
      status: i.status,
      paid_date: i.paid_date ? String(i.paid_date).slice(0, 10) : null,
      note: i.note ?? '',
    }));

    const paidAmount = installments
      .filter(i => i.status === 'paid')
      .reduce((s, i) => s + i.amount, 0);

    const allocatedAmount = installments.reduce((s, i) => s + i.amount, 0);

    return {
      id: p.id,
      project_name: p.project_name,
      sales_name: p.sales_name ?? '',
      po_no: p.po_no ?? '',
      po_value: Number(p.po_value) || 0,
      status: p.status,
      created_at: p.created_at,
      paidAmount,
      allocatedAmount,
      installments,
    };
  }

  async saveInstallments(
    projectId: number,
    rows: Array<{
      installment_no: number;
      due_date?: string | null;
      amount?: number | null;
      status?: string;
      paid_date?: string | null;
      note?: string | null;
    }>,
  ) {
    await this.installmentRepo.delete({ project_id: projectId });

    if (rows.length) {
      const entities = rows.map(r =>
        this.installmentRepo.create({
          project_id: projectId,
          installment_no: r.installment_no,
          due_date: r.due_date ? new Date(r.due_date) : null,
          amount: r.amount ?? null,
          status: (r.status as InstallmentStatus) || 'upcoming',
          paid_date: r.paid_date ? new Date(r.paid_date) : null,
          note: r.note || null,
        }),
      );
      await this.installmentRepo.save(entities);
    }

    return { success: true };
  }
}
