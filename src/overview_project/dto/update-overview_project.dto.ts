import { PartialType } from '@nestjs/mapped-types';
import { CreateOverviewProjectDto } from './create-overview_project.dto';

export class UpdateOverviewProjectDto extends PartialType(CreateOverviewProjectDto) {}
