import { z } from 'zod';

export const formSchema = z.object({
  // TODO: add media link fields
});

export type MediaLinksFormData = z.infer<typeof formSchema>;

export const defaultFormValues: MediaLinksFormData = {};
