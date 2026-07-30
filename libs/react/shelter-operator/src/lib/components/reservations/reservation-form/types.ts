import type { Control, FieldErrors } from 'react-hook-form';
import type { ReservationFormData } from './formTypes';

export interface SectionProps {
  control: Control<ReservationFormData>;
  errors: FieldErrors<ReservationFormData>;
}
