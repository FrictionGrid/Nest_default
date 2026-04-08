import { PartialType } from '@nestjs/mapped-types';
import { CreateIncomingProjectDto } from './create-incoming_project.dto';

export class UpdateIncomingProjectDto extends PartialType(CreateIncomingProjectDto) {}
