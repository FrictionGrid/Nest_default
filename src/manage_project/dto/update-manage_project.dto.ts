import { PartialType } from '@nestjs/mapped-types';
import { CreateManageProjectDto } from './create-manage_project.dto';

export class UpdateManageProjectDto extends PartialType(CreateManageProjectDto) {}
