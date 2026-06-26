import type { z } from 'zod';
import type { formSchema } from './constants/validation';

export type ReservationFormData = z.infer<typeof formSchema>;
