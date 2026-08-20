import { ProjectPoDto } from './create-incoming_project.dto';

export class UpdateIncomingProjectDto {
  item?: number;
  project_name?: string;
  type_ids?: number[];
  sales_name?: string;
  status?: 'in_progress' | 'delayed' | 'completed';
  created_at?: string;
  pos?: ProjectPoDto[];
}
