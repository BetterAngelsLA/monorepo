import type { Control, FieldErrors } from 'react-hook-form';
import type { FilteredPropertyOptions } from '../../../../../hooks/useFilteredPropertyOptions';
import type { RoomFormData } from './formSchema';

export interface SectionProps {
  control: Control<RoomFormData>;
  errors: FieldErrors<RoomFormData>;
  filteredPropertyOptions?: FilteredPropertyOptions;
}
