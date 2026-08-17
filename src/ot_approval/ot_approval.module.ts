import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtApprovalController } from './ot_approval.controller';
import { OtApprovalService } from './ot_approval.service';
import { OvertimeRequest } from '../database/entities/overtime_request.entity';
import { UsersTeam } from '../database/entities/users_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OvertimeRequest, UsersTeam])],
  controllers: [OtApprovalController],
  providers: [OtApprovalService],
})
export class OtApprovalModule {}
