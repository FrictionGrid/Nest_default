export class ProjectPoDto {
  id?: number;
  po_no?: string;
  po_value?: number;
  created_at?: string;
}

export class CreateIncomingProjectDto {
  item?: number;
  project_name: string;
  type_ids?: number[];
  sales_name?: string;
  status?: 'in_progress' | 'delayed' | 'completed';
  created_at?: string;
  pos?: ProjectPoDto[];
}
