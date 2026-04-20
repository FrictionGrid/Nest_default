import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ROLE_PERMISSIONS } from '../constants/role-permissions';

const PAGE_ROUTES: Record<string, string> = {
  'overview-project': 'GET:/overview-project',
  'incoming-project': 'GET:/incoming-project',
  'manage-project':   'GET:/manage-project',
  'manage-task':      'GET:/manage-task',
  'dashboard-team':   'GET:/dashboard-team',
};

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req.session as any)?.user ?? null;
    res.locals.sessionUser = user;

    if (user?.role) {
      const permissions = ROLE_PERMISSIONS[user.role] ?? [];
      const isAdmin = permissions.includes('*');

      res.locals.visibleMenus = Object.fromEntries(
        Object.entries(PAGE_ROUTES).map(([menu, key]) => [
          menu,
          isAdmin || permissions.includes(key),
        ]),
      );
    } else {
      res.locals.visibleMenus = Object.fromEntries(
        Object.keys(PAGE_ROUTES).map((menu) => [menu, false]),
      );
    }

    next();
  }
}
