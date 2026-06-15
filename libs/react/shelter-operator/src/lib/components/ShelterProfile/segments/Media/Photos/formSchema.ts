import { z } from 'zod';

export const formSchema = z.object({
  // TODO: add photo fields
});

export type PhotosFormData = z.infer<typeof formSchema>;

export const defaultFormValues: PhotosFormData = {};
