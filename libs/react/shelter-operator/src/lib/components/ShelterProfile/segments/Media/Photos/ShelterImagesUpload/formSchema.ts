import { z } from 'zod';
import { ShelterPhotoTypeChoices } from '../../../../../../apollo/graphql/__generated__/types';

export const formSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, 'At least one file is required'),
  photoType: z.enum(ShelterPhotoTypeChoices, {
    message: 'Photo type is required',
  }),
});

export type ShelterImagesUploadFormData = z.infer<typeof formSchema>;

export const defaultFormValues: Partial<ShelterImagesUploadFormData> = {
  files: [],
  photoType: undefined,
};
