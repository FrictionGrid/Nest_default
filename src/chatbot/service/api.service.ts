import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { BotResponse } from './logic.service';

@Injectable()
export class ApiService {
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(message: string): Promise<BotResponse> {
    const response = await this.client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: `คุณคือผู้ช่วย AI ของระบบ Rojpaiboon Dashboard ซึ่งเป็นระบบจัดการโปรเจค ระบบ automation วิศวกรรม
ตอบเป็นภาษาไทย กระชับ เป็นมิตร ห้ามสร้างข้อมูลสมมติเกี่ยวกับข้อมูลในระบบ
หากถามเรื่องข้อมูลจริงในระบบ (โปรเจค, งาน, ทีม, การเงิน) แนะนำให้ถามโดยใช้คำเช่น "โปรเจคทั้งหมด" หรือ "สถานะงาน"`,
      messages: [{ role: 'user', content: message }],
    });

    let text = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        text = block.text;
        break;
      }
    }

    return {
      reply: text || 'ขออภัยครับ ไม่สามารถตอบได้ในขณะนี้',
      quick: ['โปรเจคทั้งหมด', 'สถานะงาน', 'วิธีใช้งาน'],
    };
  }
}
