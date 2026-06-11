import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ActivityLogService } from '../../activity_log/service/activity_log.service';
import { LogAction, LogStatus } from '../../database/entities/activity_log.entity';

// Routes handled manually — skip to avoid duplicate logs
const MANUAL_ROUTES = [
  '/auth/',
  '/activity-log',
  '/manage-project/api',
  '/manage-task/api/tasks',
  '/incoming-project/api',
  '/detail-project',
  '/user-management/api',
];

const MODULE_MAP: Record<string, string> = {
  'manage-project':   'Manage Project',
  'manage-task':      'Manage Task',
  'manage-team':      'Manage Task',
  'incoming-project': 'Incoming Project',
  'detail-project':   'Detail Project',
  'dashboard-team':   'Dashboard Team',
  'overview-project': 'Overview Project',
  'user-management':  'User Management',
  'payment':          'Payment',
  'timeline':         'Timeline',
  'timeline-project': 'Timeline Project',
  'profile':          'Profile',
  'workload':         'Workload',
  'summary-year':     'Summary Year',
};

function getModule(url: string): string {
  const segment = url.split('?')[0].split('/').filter(Boolean)[0] ?? 'unknown';
  return MODULE_MAP[segment] ?? segment;
}

function getAction(method: string, url: string): LogAction | null {
  const clean = url.split('?')[0];
  if (method === 'GET' && clean.includes('/download')) return LogAction.DOWNLOAD;
  if (method === 'POST' && clean.includes('/upload'))  return LogAction.UPLOAD;
  const map: Record<string, LogAction> = {
    POST:   LogAction.CREATE,
    PUT:    LogAction.UPDATE,
    PATCH:  LogAction.UPDATE,
    DELETE: LogAction.DELETE,
  };
  return map[method] ?? null;
}

function getTargetId(url: string): number | undefined {
  const parts = url.split('?')[0].split('/').filter(Boolean);
  for (const p of parts.slice(1)) {
    const n = Number(p);
    if (Number.isInteger(n) && n > 0) return n;
  }
}

function buildDescription(method: string, url: string): string {
  const module = getModule(url);
  const id     = getTargetId(url);
  const clean  = url.split('?')[0];
  if (clean.includes('/upload'))   return `Uploaded file in ${module}`;
  if (clean.includes('/download')) return `Downloaded file in ${module}`;
  if (method === 'POST')   return `Created in ${module}`;
  if (method === 'DELETE') return id ? `Deleted #${id} in ${module}` : `Deleted in ${module}`;
  return id ? `Updated #${id} in ${module}` : `Updated in ${module}`;
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly logService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, session } = req;

    if (MANUAL_ROUTES.some(p => url.startsWith(p))) return next.handle();

    const action = getAction(method, url);
    if (!action) return next.handle();

    const user = (session as any)?.user;

    return next.handle().pipe(
      tap(() => {
        this.logService.log({
          userId:      user?.id,
          userRole:    user?.role,
          action,
          status:      LogStatus.SUCCESS,
          module:      getModule(url),
          targetId:    getTargetId(url),
          description: buildDescription(method, url),
        });
      }),
      catchError(err => {
        this.logService.log({
          userId:      user?.id,
          userRole:    user?.role,
          action,
          status:      LogStatus.FAILED,
          module:      getModule(url),
          targetId:    getTargetId(url),
          description: buildDescription(method, url),
        });
        return throwError(() => err);
      }),
    );
  }
}
