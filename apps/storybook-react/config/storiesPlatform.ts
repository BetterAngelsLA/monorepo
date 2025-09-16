import type { StoriesSpecifier } from '@storybook/types'; // ✅ public, type-only
import { join } from 'path';

const ICON_SVG_STORY_DIRS = ['../../../libs/assets/src/icons'];

export const PLATFORM_STORIES: StoriesSpecifier[] = [
  ...ICON_SVG_STORY_DIRS.map((d) => ({
    directory: join(__dirname, d),
    // files: storyFileTypes,
    // files: '**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    files: '**/*.stories.@(ts|tsx|js|jsx)',
    titlePrefix: 'Platform',
  })),
];

// join(__dirname, p, '**/*.@(mdx|stories.@(js|jsx|ts|tsx))')

// const LIB_STORY_ROOTS = [
//   '../../libs/react/components/src/lib',
//   '../../libs/assets/src/icons',
//   '../../libs/react/icons/src/lib/components',
// ];
