import type { z } from 'zod';
import type { formSchema } from './constants/formSchema';

export type ReservationFormData = z.infer<typeof formSchema>;
