import { join } from 'path';
import { SHELTER_APP_LIB_DIR } from './storiesWebApps';
import { REACT_COMPONENT_STORY_DIRS } from './storiesWebShared';

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
