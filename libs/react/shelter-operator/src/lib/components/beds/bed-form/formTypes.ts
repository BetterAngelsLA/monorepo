import type { z } from 'zod';
import type { formSchema } from './constants/formSchema';

export type BedFormData = z.infer<typeof formSchema>;
