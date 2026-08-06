import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

// หมายเหตุ: เฟสนี้ทำแค่หน้าบ้าน (frontend mockup) เท่านั้น — ทุกหน้าใช้ mock data
// ที่ฝังไว้ใน <script> ของแต่ละ .ejs เอง (เก็บ state ชั่วคราวใน localStorage ของเบราว์เซอร์)
// ยังไม่มี service/DB จริง เมื่อ confirm UI แล้วค่อยต่อ backend ตามแผนเต็มที่ออกแบบไว้
@UseGuards(AuthGuard, RolesGuard)
@Controller()
export class OtController {
  @Get('ot')
  @Render('ot')
  myOt() {
    return { pageTitle: 'My OT', pageSubtitle: 'ยื่นคำขอ OT และดูสถานะของฉัน (ยังไม่พร้อมใช้งาน)' };
  }

  @Get('ot-approval')
  @Render('ot_approval')
  approveOt() {
    return { pageTitle: 'Approve OT', pageSubtitle: 'คิวรออนุมัติ OT ของฉัน (ยังไม่พร้อมใช้งาน)' };
  }

  @Get('ot-summary')
  @Render('ot_summary')
  otSummary() {
    return { pageTitle: 'OT Summary', pageSubtitle: 'ภาพรวม OT ที่อนุมัติครบแล้วในรอบปัจจุบัน (ยังไม่พร้อมใช้งาน)' };
  }

  @Get('ot-document')
  @Render('ot_document')
  otDocument() {
    return { pageTitle: 'OT Document', pageSubtitle: 'เอกสาร OT ของคำขอนี้' };
  }
}
