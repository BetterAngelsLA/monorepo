import type { DropdownOption } from '../../base-ui/dropdown';
import type { BedFormData } from './formTypes';
import type { FormErrors } from './constants/validation';

export type BedFormFieldUpdater = <K extends keyof BedFormData>(
  field: K,
  value: BedFormData[K]
) => void;

export interface SectionProps {
  data: BedFormData;
  onChange: BedFormFieldUpdater;
  errors: FormErrors;
  roomOptions: DropdownOption<string>[];
}
