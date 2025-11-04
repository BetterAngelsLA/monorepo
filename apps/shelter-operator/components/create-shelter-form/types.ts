import type { ShelterFormData } from '../../types';

export type ShelterFormFieldUpdater = <K extends keyof ShelterFormData>(
  field: K,
  value: ShelterFormData[K]
) => void;

export interface SectionProps {
  data: ShelterFormData;
  onChange: ShelterFormFieldUpdater;
}
