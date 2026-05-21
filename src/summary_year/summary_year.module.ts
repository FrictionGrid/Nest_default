import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SummaryYearController } from './summary_year.controller';
import { SummaryYearService } from './service/summary_year.service';
import { ProjectIncoming } from '../database/entities/project_incoming.entity';
import { ProjectTeam } from '../database/entities/project_team.entity';
import { ProjectType } from '../database/entities/project_type.entity';
import { Team } from '../database/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectIncoming, ProjectTeam, ProjectType, Team])],
  controllers: [SummaryYearController],
  providers: [SummaryYearService],
})
export class SummaryYearModule {}
