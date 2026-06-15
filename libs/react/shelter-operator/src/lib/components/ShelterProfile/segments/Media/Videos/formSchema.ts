import { z } from 'zod';

export const formSchema = z.object({
  // TODO: add video fields
});

export type VideosFormData = z.infer<typeof formSchema>;

export const defaultFormValues: VideosFormData = {};
