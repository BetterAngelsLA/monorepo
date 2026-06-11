import type { Control, FieldErrors } from 'react-hook-form';
import type { DropdownOption } from '../../base-ui/dropdown';
import type { BedFormData } from './formTypes';

export interface SectionProps {
  control: Control<BedFormData>;
  errors: FieldErrors<BedFormData>;
  roomOptions: DropdownOption<string>[];
}
