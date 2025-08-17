import { join } from 'path';

const LIB_STORY_ROOTS = [
  '../../libs/react/components/src/lib',
  '../../libs/assets/src/icons',
  '../../libs/react/icons/src/lib/components',
];

const LIB_CONTENT_ROOTS = [
  './src', // host
  '../../libs/react/storybook-web/src/lib', // storybook-web lib
  ...LIB_STORY_ROOTS,
];

export const LIB_STORY_GLOBS = [
  ...LIB_STORY_ROOTS.map((p) =>
    join(__dirname, p, '**/*.@(mdx|stories.@(js|jsx|ts|tsx))')
  ),
];

export const LIB_CONTENT_GLOBS = [
  ...LIB_CONTENT_ROOTS.map((p) => join(__dirname, p, '**/*.{ts,tsx,mdx,html}')),
];
