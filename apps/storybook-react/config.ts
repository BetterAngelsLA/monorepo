import { join } from 'path';
import { StoriesSpecifier } from 'storybook/internal/types';

const storyFileTypes = '**/*.@(mdx|stories.@(js|jsx|ts|tsx))';

// source directories
const ICON_SVG_STORY_DIRS = ['../../libs/assets/src/icons'];

const REACT_ICON_COMPONENT_DIRS = ['../../libs/react/icons/src/lib/components'];

const REACT_COMPONENT_STORY_DIRS = ['../../libs/react/components/src/lib'];

// stories
export const PLATFORM_STORIES: StoriesSpecifier[] = [
  ...ICON_SVG_STORY_DIRS.map((d) => ({
    directory: join(__dirname, d),
    files: storyFileTypes,
    titlePrefix: 'Platform',
  })),
];

export const REACT_STORIES: StoriesSpecifier[] = [
  ...REACT_ICON_COMPONENT_DIRS.map((d) => ({
    directory: join(__dirname, d),
    files: storyFileTypes,
    titlePrefix: 'Web/Icons',
  })),
  ...REACT_COMPONENT_STORY_DIRS.map((d) => ({
    directory: join(__dirname, d),
    files: storyFileTypes,
    titlePrefix: 'Web/Components',
  })),
];

// use RN_COMPONENT_STORY_DIRS pattern once expo lib stories are updated
// currently the placeholder stories have duplicate names which crashes
export const RN_STORIES: StoriesSpecifier[] = [
  {
    directory: join(
      __dirname,
      '../../libs/expo/shared/ui-components/src/lib/Pill'
    ),
    files: 'Pill.stories.tsx',
    titlePrefix: 'RN Components',
  },
  {
    directory: join(
      __dirname,
      '../../libs/expo/shared/ui-components/src/lib/PillContainer'
    ),
    files: 'PillContainer.stories.tsx',
    titlePrefix: 'RN Components',
  },
];

// For tailwind to generate classes
const TAILWIND_CONTENT_DIRS = [
  './src', // host
  '../../libs/react/storybook/src/lib', // react storybook lib
  ...REACT_COMPONENT_STORY_DIRS, // react components lib
];

export const TAILWIND_CONTENT_GLOBS = [
  ...TAILWIND_CONTENT_DIRS.map((p) =>
    join(__dirname, p, '**/*.{ts,tsx,mdx,html}')
  ),
];
