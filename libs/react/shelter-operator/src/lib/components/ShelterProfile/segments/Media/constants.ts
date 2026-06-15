export const MEDIA_TABS = ['photos', 'videos', 'media-links'] as const;

export type MediaTab = (typeof MEDIA_TABS)[number];

export const MEDIA_TAB_LABELS: Record<MediaTab, string> = {
  photos: 'Photos',
  videos: 'Videos',
  'media-links': 'Media Links',
};
