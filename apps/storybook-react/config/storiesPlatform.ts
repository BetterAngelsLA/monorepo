import type { StoriesSpecifier } from '@storybook/types'; // ✅ public, type-only
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { storyFileTypes } from './constants.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ICON_SVG_STORY_DIRS = ['../../../libs/assets/src/icons'];

export const PLATFORM_STORIES: StoriesSpecifier[] = [
  ...ICON_SVG_STORY_DIRS.map((d) => ({
    directory: join(__dirname, d),
    files: storyFileTypes,
    titlePrefix: 'Platform',
  })),
];
