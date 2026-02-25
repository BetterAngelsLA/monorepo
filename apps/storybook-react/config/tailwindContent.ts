import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { SHELTER_APP_LIB_DIR } from './storiesWebApps.ts';
import { REACT_COMPONENT_STORY_DIRS } from './storiesWebShared.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TAILWIND_CONTENT_DIRS = [
  '../src', // host
  '../../../libs/react/storybook/src/lib', // react storybook lib
  ...REACT_COMPONENT_STORY_DIRS, // react components lib
  SHELTER_APP_LIB_DIR,
];

export const TAILWIND_CONTENT_GLOBS = [
  ...TAILWIND_CONTENT_DIRS.map((p) =>
    join(__dirname, p, '**/*.{ts,tsx,mdx,html}')
  ),
];
