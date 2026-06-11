import type { Control, FieldErrors } from 'react-hook-form';
import type { RoomFormData } from './formTypes';

export interface SectionProps {
  control: Control<RoomFormData>;
  errors: FieldErrors<RoomFormData>;
}
