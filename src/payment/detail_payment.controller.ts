import { Body, Controller, Get, Param, Post, Render, UseGuards } from '@nestjs/common';
import { PaymentService } from './service/payment.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@UseGuards(AuthGuard, RolesGuard)
@Controller('detail-payment')
export class DetailPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':id')
  @Render('detail_payment')
  async index(@Param('id') id: string) {
    const project = await this.paymentService.getProjectById(Number(id));
    return {
      pageTitle: 'Payment Detail',
      pageSubtitle: project?.project_name ?? '',
      project,
    };
  }

  @Post(':id/save')
  async save(@Param('id') id: string, @Body() dto: any) {
    return this.paymentService.saveInstallments(Number(id), dto.installments ?? []);
  }
}
