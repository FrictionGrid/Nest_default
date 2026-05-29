import { Controller, Get, Query, Render, UseGuards } from '@nestjs/common';
import { PaymentService } from './service/payment.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @Render('payment')
  index() {
    return {
      pageTitle: 'Payment',
      pageSubtitle: 'ภาพรวมแผนการชำระเงินโครงการ',
    };
  }

  @Get('api/projects')
  async getProjects(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('year')   year?: string,
    @Query('month')  month?: string,
    @Query('sale')   sale?: string,
  ) {
    return this.paymentService.getAllProjects(
      search,
      status,
      year  ? Number(year)  : undefined,
      month ? Number(month) : undefined,
      sale,
    );
  }
}
