import { z } from 'zod';
import { ShelterPhotoTypeChoices } from '@monorepo/ba-platform/types';

export const formSchema = z.object({
  photoType: z.enum(
    [ShelterPhotoTypeChoices.Interior, ShelterPhotoTypeChoices.Exterior],
    {
      message: 'Photo type is required',
    }
  ),
});

export type ShelterPhotoFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(formSchema.shape);
