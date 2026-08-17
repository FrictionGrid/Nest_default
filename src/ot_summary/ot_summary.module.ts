import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtSummaryController } from './ot_summary.controller';
import { OtSummaryService } from './ot_summary.service';
import { OvertimeRequest } from '../database/entities/overtime_request.entity';
import { UsersTeam } from '../database/entities/users_team.entity';
import { EmployeeProfile } from '../database/entities/employee_profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OvertimeRequest, UsersTeam, EmployeeProfile])],
  controllers: [OtSummaryController],
  providers: [OtSummaryService],
})
export class OtSummaryModule {}
