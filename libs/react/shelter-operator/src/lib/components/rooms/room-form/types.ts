import type { RoomFormData } from './formTypes';
import type { FormErrors } from './constants/validation';

export type RoomFormFieldUpdater = <K extends keyof RoomFormData>(
  field: K,
  value: RoomFormData[K]
) => void;

export interface SectionProps {
  data: RoomFormData;
  onChange: RoomFormFieldUpdater;
  errors: FormErrors;
}
