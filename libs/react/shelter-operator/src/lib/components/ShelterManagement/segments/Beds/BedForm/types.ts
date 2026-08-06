import type { Control, FieldErrors } from 'react-hook-form';
import type { FilteredPropertyOptions } from '../../../../../hooks';
import type { BedFormData } from './formSchema';

export interface SectionProps {
  control: Control<BedFormData>;
  errors: FieldErrors<BedFormData>;
  filteredPropertyOptions?: FilteredPropertyOptions;
}
