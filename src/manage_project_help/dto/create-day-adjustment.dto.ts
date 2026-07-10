export type DayAdjustmentFactorType =
  | 'internal_staff'
  | 'external_staff'
  | 'requirement_change'
  | 'emergency'
  | 'other';

export class CreateDayAdjustmentDto {
  factor_type: DayAdjustmentFactorType;
  note?: string;
  days_delta: number;
}
