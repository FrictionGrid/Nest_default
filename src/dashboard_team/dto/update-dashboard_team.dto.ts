import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardTeamDto } from './create-dashboard_team.dto';
import { IsInt, Min, Max } from 'class-validator';

export class UpdateDashboardTeamDto extends PartialType(CreateDashboardTeamDto) {
  @IsInt() @Min(0) @Max(100)
  progress?: number;
}
