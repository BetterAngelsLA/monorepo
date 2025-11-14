import type { ShelterFormData } from '../../types';
import type { FormErrors } from './constants/validation';

export type ShelterFormFieldUpdater = <K extends keyof ShelterFormData>(
  field: K,
  value: ShelterFormData[K]
) => void;

export interface SectionProps {
  data: ShelterFormData;
  onChange: ShelterFormFieldUpdater;
  errors: FormErrors;
}
