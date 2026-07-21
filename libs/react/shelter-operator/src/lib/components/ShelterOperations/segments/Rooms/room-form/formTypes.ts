import type { z } from 'zod';
import type { formSchema } from './constants/formSchema';

export type RoomFormData = z.infer<typeof formSchema>;
