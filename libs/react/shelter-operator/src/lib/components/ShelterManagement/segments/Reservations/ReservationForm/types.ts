import type { Control, FieldErrors } from 'react-hook-form';
import type { ReservationFormData } from './formSchema';

export interface SectionProps {
  control: Control<ReservationFormData>;
  errors: FieldErrors<ReservationFormData>;
}
