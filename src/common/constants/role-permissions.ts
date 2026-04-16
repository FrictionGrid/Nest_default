export const ROLE_DEFAULT_PAGE: Record<string, string> = {
  admin:         '/overview-project',
  adminsystem:   '/overview-project',
  manager:       '/overview-project',
  head_engineer: '/overview-project',
  engineer:      '/dashboard-team',
  sale:          '/overview-project',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // ── Full access ──────────────────────────────────────────────────────────
  adminsystem: ['*'],
  manager:     ['*'],

  // ── overview + incoming + detail (GET/POST/PUT/DELETE) ───────────────────
  admin: [
    'GET:/overview-project',
    'GET:/overview-project/api/team-stats',
    'GET:/incoming-project',
    'GET:/incoming-project/api/projects',
    'POST:/incoming-project/api/projects',
    'PUT:/incoming-project/api/projects/:id',
    'DELETE:/incoming-project/api/projects/:id',
    'GET:/detail-project/:id',
  ],

  // ── All pages + POST/PUT only (no DELETE) ───────────────────────────────
  head_engineer: [
    // Pages
    'GET:/overview-project',
    'GET:/overview-project/api/team-stats',
    'GET:/incoming-project',
    'GET:/manage-project',
    'GET:/manage-team',
    'GET:/dashboard-team',
    'GET:/detail-project/:id',
    // Manage Project
    'GET:/incoming-project/api/projects',
    'POST:/incoming-project/api/projects',
    'PUT:/incoming-project/api/projects/:id',
    // Manage Project API
    'POST:/manage-project/api',
    'PUT:/manage-project/api/:id',
    'PUT:/manage-project/api/:id/complete',
    // Manage Team API
    'GET:/manage-team/api',
    'POST:/manage-team/api',
    'PUT:/manage-team/api/:id',
    'GET:/manage-team/api/tasks',
    'POST:/manage-team/api/tasks',
    'PUT:/manage-team/api/tasks/:id',
    // Dashboard Team API
    'PUT:/dashboard-team/api/tasks/:id/complete',
  ],

  // ── dashboard-team page only (all actions) + detail ─────────────────────
  engineer: [
    'GET:/dashboard-team',
    'PUT:/dashboard-team/api/tasks/:id/complete',
    'GET:/detail-project/:id',
  ],

  // ── overview + incoming + detail (GET/POST/PUT, no DELETE) ───────────────
  sale: [
    'GET:/overview-project',
    'GET:/overview-project/api/team-stats',
    'GET:/incoming-project',
    'GET:/incoming-project/api/projects',
    'POST:/incoming-project/api/projects',
    'PUT:/incoming-project/api/projects/:id',
    'GET:/detail-project/:id',
  ],
};
