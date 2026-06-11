import type { z } from 'zod';
import type { formSchema } from './constants/validation';

export type BedFormData = z.infer<typeof formSchema>;
