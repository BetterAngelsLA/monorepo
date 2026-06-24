import { z } from 'zod';
import { ShelterPhotoTypeChoices } from '../../../../../../apollo/graphql/__generated__/types';

export const formSchema = z.object({
  photoType: z.enum(
    [ShelterPhotoTypeChoices.Interior, ShelterPhotoTypeChoices.Exterior],
    {
      message: 'Photo type is required',
    }
  ),
});

export type ShelterPhotoFormData = z.infer<typeof formSchema>;
