import { PartialType } from '@nestjs/mapped-types';
import { CreateManageTeamDto } from './create-manage_team.dto';

export class UpdateManageTeamDto extends PartialType(CreateManageTeamDto) {}
