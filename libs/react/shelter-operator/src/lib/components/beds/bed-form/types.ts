import type { Control, FieldErrors } from 'react-hook-form';
import type { FilteredPropertyOptions } from '../../../hooks/useFilteredPropertyOptions';
import type { BedFormData } from './formTypes';

export interface SectionProps {
  control: Control<BedFormData>;
  errors: FieldErrors<BedFormData>;
  filteredPropertyOptions?: FilteredPropertyOptions;
}
