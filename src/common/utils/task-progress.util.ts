const TASK_TYPE_WEIGHTS: Record<string, number> = {
  'PO/Quotation':             0,
  'Wiring Diagram':          10,
  'Graphic 3D':              20,
  'Controller I/O':          10,
  'FAT & SAT':               10,
  'Programming/GUI':         30,
  'Testing & Commissioning': 15,
  'Handover Doc':             5,
  'Defect list':              0,
  'Other':                    0,
};

export function calcTaskProgress(tasks: { task_type: string | null; progress: number; status: string }[]): number {
  if (tasks.length === 0) return 0;

  const groups: Record<string, typeof tasks> = {};
  for (const task of tasks) {
    const type = task.task_type || 'Other';
    if ((TASK_TYPE_WEIGHTS[type] ?? 0) === 0) continue;
    if (!groups[type]) groups[type] = [];
    groups[type].push(task);
  }

  let totalWeight = 0;
  for (const type of Object.keys(groups)) {
    totalWeight += TASK_TYPE_WEIGHTS[type]!;
  }
  if (totalWeight === 0) return 0;

  let overall = 0;
  for (const [type, typeTasks] of Object.entries(groups)) {
    const normalizedWeight = (TASK_TYPE_WEIGHTS[type]! / totalWeight) * 100;
    const perTaskWeight = normalizedWeight / typeTasks.length;
    for (const task of typeTasks) {
      const pct = task.status === 'completed' ? 100 : task.progress;
      overall += (pct / 100) * perTaskWeight;
    }
  }

  return Math.round(overall);
}
