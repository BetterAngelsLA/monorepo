import { MediaLinkTypeChoices } from '@monorepo/ba-platform/types';
import { extractYouTubeVideoId } from '@monorepo/react/shared';
import { z } from 'zod';

/**
 * Per-media-type URL rules, mirroring the backend's ``MEDIA_TYPE_VALIDATORS``
 * (apps/betterangels-backend/shelters/models/media.py). The backend re-validates
 * on save; this surfaces the same rule in the form.
 */
const MEDIA_TYPE_URL_RULES: Record<
  MediaLinkTypeChoices,
  { label: string; placeholder: string; isValid: (url: string) => boolean }
> = {
  [MediaLinkTypeChoices.Youtube]: {
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/watch?v=...',
    isValid: (url) => extractYouTubeVideoId(url) !== null,
  },
};

export function getUrlRule(mediaType?: MediaLinkTypeChoices) {
  return MEDIA_TYPE_URL_RULES[mediaType ?? MediaLinkTypeChoices.Youtube];
}

export const formSchema = z
  .object({
    mediaType: z.enum(MediaLinkTypeChoices, {
      message: 'Media type is required',
    }),
    url: z
      .string()
      .trim()
      .min(1, 'URL is required')
      .max(255, 'URL must be 255 characters or fewer'),
    title: z.string().trim().max(255, 'Title must be 255 characters or fewer'),
  })
  .superRefine((values, ctx) => {
    const rule = MEDIA_TYPE_URL_RULES[values.mediaType];

    if (rule && !rule.isValid(values.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: `Enter a valid ${rule.label} URL.`,
      });
    }
  });

export type MediaLinkFormData = z.infer<typeof formSchema>;

// Media link fields whose errors MediaLinkForm can render.
export const formFieldNames = Object.keys(formSchema.shape);

export const defaultFormValues: MediaLinkFormData = {
  mediaType: MediaLinkTypeChoices.Youtube,
  url: '',
  title: '',
};
