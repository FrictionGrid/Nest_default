import { PartialType } from '@nestjs/mapped-types';
import { CreateDetailProjectDto } from './create-detail_project.dto';

export class UpdateDetailProjectDto extends PartialType(CreateDetailProjectDto) {}
