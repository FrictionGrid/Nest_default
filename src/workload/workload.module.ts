import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkloadService } from './service/workload.service';
import { WorkloadController } from './workload.controller';
import { TaskTeam } from '../database/entities/task_team.entity';
import { User } from '../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTeam, User])],
  controllers: [WorkloadController],
  providers: [WorkloadService],
})
export class WorkloadModule {}
