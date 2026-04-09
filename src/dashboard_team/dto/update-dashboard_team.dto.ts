import { PartialType } from '@nestjs/mapped-types';
import { CreateDashboardTeamDto } from './create-dashboard_team.dto';

export class UpdateDashboardTeamDto extends PartialType(CreateDashboardTeamDto) {}
