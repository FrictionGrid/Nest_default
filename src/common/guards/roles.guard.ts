import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request.session as any)?.user;

    if (!user?.role) {
      throw new ForbiddenException('Access denied: no role assigned');
    }

    const permissions = ROLE_PERMISSIONS[user.role];

    if (!permissions) {
      throw new ForbiddenException(`Access denied: unknown role "${user.role}"`);
    }

    if (permissions.includes('*')) {
      return true;
    }

    const key = `${request.method}:${request.route?.path ?? request.path}`;

    if (permissions.includes(key)) {
      return true;
    }

    throw new ForbiddenException(`Access denied: "${user.role}" cannot access ${key}`);
  }
}
