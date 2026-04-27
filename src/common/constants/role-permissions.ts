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

  // ── overview + incoming + detail ────────────────────────────────────────
  admin: [
    'GET:/overview-project',
    'GET:/overview-project/api/team-stats',
    'GET:/incoming-project',
    'GET:/incoming-project/api/projects',
    'POST:/incoming-project/api/projects',
    'PUT:/incoming-project/api/projects/:id',
    'DELETE:/incoming-project/api/projects/:id',
    'GET:/detail-project/:id',
    'GET:/detail-project/:id/documents',
    'POST:/detail-project/:id/documents/:typeId/upload',
    'DELETE:/detail-project/documents/file/:fileId',
    'GET:/detail-project/documents/file/:fileId/download',
  ],

  // ── overview + detail + manage-project + manage-task + dashboard + timeline
  head_engineer: [
    'GET:/overview-project',
    'GET:/overview-project/api/team-stats',
    'GET:/timeline',
    'GET:/manage-project',
    'GET:/manage-task',
    'GET:/dashboard-team',
    'GET:/detail-project/:id',
    // Manage Project API
    'POST:/manage-project/api',
    'PUT:/manage-project/api/:id',
    'PUT:/manage-project/api/:id/complete',
    // Manage Task API
    'GET:/manage-task/api',
    'POST:/manage-task/api',
    'PUT:/manage-task/api/:id',
    'GET:/manage-task/api/tasks',
    'POST:/manage-task/api/tasks',
    'PUT:/manage-task/api/tasks/:id',
    // Dashboard Team API
    'PUT:/dashboard-team/api/tasks/:id/complete',
    'PUT:/dashboard-team/api/tasks/:id/problem',
    // Document API
    'GET:/detail-project/:id/documents',
    'POST:/detail-project/:id/documents/:typeId/upload',
    'DELETE:/detail-project/documents/file/:fileId',
    'GET:/detail-project/documents/file/:fileId/download',
  ],

  // ── dashboard-team + detail ──────────────────────────────────────────────
  engineer: [
    'GET:/dashboard-team',
    'PUT:/dashboard-team/api/tasks/:id/complete',
    'PUT:/dashboard-team/api/tasks/:id/problem',
    'GET:/detail-project/:id',
    'GET:/detail-project/:id/documents',
    'POST:/detail-project/:id/documents/:typeId/upload',
    'DELETE:/detail-project/documents/file/:fileId',
    'GET:/detail-project/documents/file/:fileId/download',
  ],

  // ── overview only ────────────────────────────────────────────────────────
  sale: [
    'GET:/overview-project',
    'GET:/overview-project/api/team-stats',
  ],
};
