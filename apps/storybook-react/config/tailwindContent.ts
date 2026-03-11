import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PLATFORM_STORIES } from './storiesPlatform.ts';
import { RN_SHARED_LIB_STORIES } from './storiesReactNative.ts';
import { REACT_APP_LIB_STORIES } from './storiesWebApps.ts';
import { REACT_SHARED_LIB_STORIES } from './storiesWebShared.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Derive content dirs from all story specifiers so they stay in sync
// automatically — no manual list to forget when adding a new lib.
const storyDirs = [
  ...PLATFORM_STORIES,
  ...REACT_SHARED_LIB_STORIES,
  ...RN_SHARED_LIB_STORIES,
  ...REACT_APP_LIB_STORIES,
].map((s) => s.directory);

export const TAILWIND_CONTENT_GLOBS = [
  // storybook host app
  join(__dirname, '../src', '**/*.{ts,tsx,mdx,html}'),
  // all story source directories
  ...storyDirs.map((dir) => join(dir, '**/*.{ts,tsx,mdx,html}')),
];
