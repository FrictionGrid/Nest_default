import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { DetailPaymentController } from './detail_payment.controller';
import { PaymentService } from './service/payment.service';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { PaymentInstallment } from '../database/entities/payment_installment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectIncoming, PaymentInstallment])],
  controllers: [PaymentController, DetailPaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
