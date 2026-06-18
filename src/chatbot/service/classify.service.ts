import { Injectable } from '@nestjs/common';

export type Intent = 'project_overview' | 'task_status' | 'team_info' | 'payment_info' | 'help';

export interface ClassifyResult {
  type: 'locked' | 'free';
  intent: Intent | null;
  confidence: number;
  entities: Record<string, unknown>;
} 

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  project_overview: [
    'โปรเจค', 'project', 'มีกี่โปรเจค' ,
    'โปรเจคทั้งหมด', 'รายการโปรเจค', 'สถานะโปรเจค', 'กำลังดำเนิน', 'incoming',
  ],
  task_status: [
    'สถานะงาน', 'task', 'งาน', 'ความคืบหน้า', 'progress', 'งานที่มีปัญหา',
    'ปัญหา', 'problem', 'งานค้าง', 'replanned', 'มีกี่งาน',
    'งานใกล้ครบ', 'deadline',
  ],
  team_info: [
    'ทีม', 'team', 'สมาชิก', 'engineer', 'member', 'ทีมทั้งหมด', 'มีกี่ทีม',
    'ทีมไหน', 'ใครอยู่ทีม', 'หัวหน้าทีม',
  ],
  payment_info: [
    'ชำระเงิน', 'payment', 'การเงิน', 'งวด', 'invoice', 'ค้างชำระ',
    'ยังไม่ชำระ', 'overdue', 'สรุปเงิน', 'จ่ายเงิน', 'บาท', 'installment',
  ],
  help: [
    'วิธีใช้', 'ใช้งาน', 'help', 'คู่มือ', 'เริ่มต้น', 'เมนู', 'menu',
    'ทำอะไรได้', 'ความสามารถ', 'feature', 'ฟีเจอร์',
  ],
};

@Injectable()
export class ClassifyService {
  classify(text: string): ClassifyResult {
    const lower = text.toLowerCase().trim();

    let bestIntent: Intent | null = null;
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [Intent, string[]][]) {
      const score = keywords.filter(kw => lower.includes(kw.toLowerCase())).length;
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    if (bestIntent && bestScore > 0) {
      return { type: 'locked', intent: bestIntent, confidence: Math.min(1, bestScore * 0.4), entities: {} };
    }

    return { type: 'free', intent: null, confidence: 0, entities: {} };
  }
}
