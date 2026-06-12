import type { z } from 'zod';
import type { formSchema } from './constants/validation';

export type RoomFormData = z.infer<typeof formSchema>;
