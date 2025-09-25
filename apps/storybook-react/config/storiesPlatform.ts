import type { StoriesSpecifier } from '@storybook/types'; // ✅ public, type-only
import { join } from 'path';
import { storyFileTypes } from './constants';

const ICON_SVG_STORY_DIRS = ['../../../libs/assets/src/icons'];

export const PLATFORM_STORIES: StoriesSpecifier[] = [
  ...ICON_SVG_STORY_DIRS.map((d) => ({
    directory: join(__dirname, d),
    files: storyFileTypes,
    titlePrefix: 'Platform',
  })),
];
