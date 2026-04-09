export class CreateIncomingProjectDto {
  item?: number;
  project_name: string;
  type_ids?: number[];
  sales_name?: string;
  po_value?: number;
  po_no?: string;
  status?: 'in_progress' | 'delayed' | 'completed';
  start_date?: string;
  end_date?: string;
}
