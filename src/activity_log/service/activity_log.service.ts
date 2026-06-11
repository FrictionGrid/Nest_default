import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, LogAction, LogStatus } from '../../database/entities/activity_log.entity';
import { ProjectTeam } from '../../database/entities/project_team.entity';
import { ProjectIncoming } from '../../database/entities/project_incoming.entity';
import { TaskTeam } from '../../database/entities/task_team.entity';
import { User } from '../../database/entities/user.entity';
import { ProjectDocumentFile } from '../../database/entities/project_document_file.entity';

interface LogPayload {
  userId?: number;
  userRole?: string;
  action: LogAction;
  status?: LogStatus;
  module: string;
  targetId?: number;
  description?: string;
}

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(ActivityLog)         private readonly repo: Repository<ActivityLog>,
    @InjectRepository(ProjectTeam)         private readonly projectTeamRepo: Repository<ProjectTeam>,
    @InjectRepository(ProjectIncoming)     private readonly projectRepo: Repository<ProjectIncoming>,
    @InjectRepository(TaskTeam)            private readonly taskRepo: Repository<TaskTeam>,
    @InjectRepository(User)                private readonly userRepo: Repository<User>,
    @InjectRepository(ProjectDocumentFile) private readonly fileRepo: Repository<ProjectDocumentFile>,
  ) {}

  // ── Base save ────────────────────────────────────────────────────────────

  async log(payload: LogPayload): Promise<void> {
    try {
      const entry = this.repo.create({
        user_id:     payload.userId,
        user_role:   payload.userRole,
        action:      payload.action,
        status:      payload.status ?? LogStatus.SUCCESS,
        module:      payload.module,
        target_id:   payload.targetId,
        description: payload.description,
      });
      await this.repo.save(entry);
    } catch { /* never throw from logging */ }
  }

  // ── Auth ─────────────────────────────────────────────────────────────────

  async logAuth(
    action: 'login' | 'logout',
    opts: { userId?: number; userRole?: string; username?: string; status: LogStatus },
  ) {
    const desc: Record<string, string> = {
      login_success:  'เข้าสู่ระบบสำเร็จ',
      login_failed:   'เข้าสู่ระบบล้มเหลว - รหัสผ่านผิด',
      logout_success: 'ออกจากระบบ',
    };
    const key = `${action}_${opts.status === LogStatus.FAILED ? 'failed' : 'success'}`;
    await this.log({
      userId: opts.userId, userRole: opts.userRole,
      action: action === 'login' ? LogAction.LOGIN : LogAction.LOGOUT,
      status: opts.status,
      module: 'Auth',
      description: desc[key] ?? action,
    });
  }

  // ── Incoming Project ─────────────────────────────────────────────────────

  async logIncomingProject(
    action: 'create' | 'update' | 'delete',
    projectId: number,
    opts: { userId?: number; userRole?: string; projectName?: string },
  ) {
    const name = opts.projectName ?? (await this.projectRepo.findOne({ where: { id: projectId } }))?.project_name ?? `#${projectId}`;
    const desc: Record<string, string> = {
      create: `สร้างโปรเจค ${name}`,
      update: `แก้ไขโปรเจค ${name}`,
      delete: `ลบโปรเจค ${name}`,
    };
    await this.log({
      userId: opts.userId, userRole: opts.userRole,
      action: LogAction[action.toUpperCase() as keyof typeof LogAction],
      module: 'Incoming Project',
      targetId: projectId,
      description: desc[action],
    });
  }

  // ── Manage Project ───────────────────────────────────────────────────────

  async logProject(
    action: 'create' | 'update' | 'delete' | 'complete',
    projectTeamId: number,
    opts: { userId?: number; userRole?: string },
  ) {
    const row = await this.projectTeamRepo.findOne({
      where: { id: projectTeamId },
      relations: ['project', 'team'],
    });
    const pName = row?.project?.project_name ?? `#${projectTeamId}`;
    const tName = row?.team?.name ?? '';
    const desc: Record<string, string> = {
      create:   `มอบหมายโปรเจค ${pName} ให้ทีม ${tName}`,
      update:   `แก้ไข ${pName} ทีม ${tName}`,
      delete:   `ลบ ${pName} ออกจากทีม ${tName}`,
      complete: `ปิดโปรเจค ${pName}`,
    };
    await this.log({
      userId: opts.userId, userRole: opts.userRole,
      action: action === 'complete' ? LogAction.UPDATE : LogAction[action.toUpperCase() as keyof typeof LogAction],
      module: 'Manage Project',
      targetId: projectTeamId,
      description: desc[action],
    });
  }

  // ── Manage Task ──────────────────────────────────────────────────────────

  async logTask(
    action: 'create' | 'update' | 'delete',
    taskId: number,
    opts: { userId?: number; userRole?: string; taskName?: string; assigneeId?: number },
  ) {
    const task     = opts.taskName ? null : await this.taskRepo.findOne({ where: { id: taskId } });
    const taskName = opts.taskName ?? task?.task_name ?? `#${taskId}`;
    const assigneeId = opts.assigneeId ?? task?.user_id;
    let assigneeName = '';
    if (assigneeId) {
      const u = await this.userRepo.findOne({ where: { id: assigneeId } });
      assigneeName = u?.display_name ?? u?.username ?? '';
    }
    const desc: Record<string, string> = {
      create: `สร้าง Task ${taskName}${assigneeName ? ` ให้ ${assigneeName}` : ''}`,
      update: `แก้ไข Task ${taskName}`,
      delete: `ลบ Task ${taskName}`,
    };
    await this.log({
      userId: opts.userId, userRole: opts.userRole,
      action: LogAction[action.toUpperCase() as keyof typeof LogAction],
      module: 'Manage Task',
      targetId: taskId,
      description: desc[action],
    });
  }

  // ── Document ─────────────────────────────────────────────────────────────

  async logDocument(
    action: 'upload' | 'delete' | 'download',
    opts: { userId?: number; userRole?: string; fileId?: number; fileName?: string; projectName?: string },
  ) {
    const fileName    = opts.fileName    ?? (opts.fileId ? (await this.fileRepo.findOne({ where: { id: opts.fileId } }))?.filename : null) ?? 'ไฟล์';
    const projectPart = opts.projectName ? ` โปรเจค ${opts.projectName}` : '';
    const desc: Record<string, string> = {
      upload:   `อัปโหลดไฟล์ ${fileName}${projectPart}`,
      delete:   `ลบไฟล์ ${fileName}`,
      download: `ดาวน์โหลดไฟล์ ${fileName}`,
    };
    await this.log({
      userId: opts.userId, userRole: opts.userRole,
      action: action === 'upload' ? LogAction.UPLOAD : action === 'download' ? LogAction.DOWNLOAD : LogAction.DELETE,
      module: 'Detail Project',
      targetId: opts.fileId,
      description: desc[action],
    });
  }

  // ── User Management ──────────────────────────────────────────────────────

  async logUser(
    action: 'create' | 'delete' | 'update',
    targetUserId: number,
    opts: { userId?: number; userRole?: string; username?: string },
  ) {
    const name = opts.username ?? (await this.userRepo.findOne({ where: { id: targetUserId } }))?.username ?? `#${targetUserId}`;
    const desc: Record<string, string> = {
      create: `สร้างบัญชีผู้ใช้ "${name}"`,
      delete: `ลบบัญชีผู้ใช้ "${name}"`,
      update: `แก้ไขบัญชีผู้ใช้ "${name}"`,
    };
    await this.log({
      userId: opts.userId, userRole: opts.userRole,
      action: LogAction[action.toUpperCase() as keyof typeof LogAction],
      module: 'User Management',
      targetId: targetUserId,
      description: desc[action],
    });
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async removeAll(): Promise<void> {
    await this.repo.clear();
  }

  // ── Query (for controller) ───────────────────────────────────────────────

  async findAll(filters: {
    action?: string;
    module?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { action, module, status, search, page = 1, limit = 100 } = filters;

    const qb = this.repo
      .createQueryBuilder('log')
      .leftJoin('log.user', 'u')
      .select([
        'log.id', 'log.action', 'log.status', 'log.module',
        'log.target_id', 'log.description', 'log.user_role', 'log.created_at',
        'u.id', 'u.display_name', 'u.username',
      ])
      .orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (action) qb.andWhere('log.action = :action', { action });
    if (module) qb.andWhere('log.module = :module', { module });
    if (status) qb.andWhere('log.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(u.username ILIKE :s OR u.display_name ILIKE :s OR log.description ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
