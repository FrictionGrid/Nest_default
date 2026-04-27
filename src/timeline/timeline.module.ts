import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { User } from '../database/entities/user.entity';
import { TaskTeam } from '../database/entities/task_team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TaskTeam])],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}
