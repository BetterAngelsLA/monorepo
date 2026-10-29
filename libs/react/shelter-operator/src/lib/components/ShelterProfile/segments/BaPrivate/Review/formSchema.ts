import { z } from 'zod';
import { ShelterProfileType } from '../../../types';

export const formSchema = z.object({
  overallRating: z.number().int().min(1).max(5).nullable(),
  declinedBaVisit: z.boolean(),
  subjectiveReview: z.string(), // RichTextEditor field
});

export type ReviewFormData = z.infer<typeof formSchema>;

export const formFieldNames = Object.keys(formSchema.shape);

export const defaultFormValues: ReviewFormData = {
  overallRating: null,
  declinedBaVisit: false,
  subjectiveReview: '',
};

export function toFormData(shelter: ShelterProfileType): ReviewFormData {
  return {
    overallRating: shelter.overallRating ?? null,
    declinedBaVisit: shelter.declinedBaVisit ?? false,
    subjectiveReview: shelter.subjectiveReview ?? '',
  };
}
