import { join } from 'path';

const LIB_STORY_ROOTS = [
  '../../libs/react/components/src/lib',
  '../../libs/assets/src/icons',
  '../../libs/react/icons/src/lib/components',
];

const RN_LIB_STORY_ROOTS = ['../../libs/expo/shared/ui-components/src/lib'];

const LIB_CONTENT_ROOTS = [
  './src', // host
  '../../libs/react/storybook/src/lib', // react storybook lib
  ...LIB_STORY_ROOTS,
];

export const REACT_LIB_STORY_GLOBS = [
  ...LIB_STORY_ROOTS.map((p) =>
    join(__dirname, p, '**/*.@(mdx|stories.@(js|jsx|ts|tsx))')
  ),
];

// TODO: use glob once `placeholder` files are updated
// right now they all have same name and collide
// export const RN_LIB_STORY_GLOBS = [
//   ...RN_LIB_STORY_ROOTS.map((p) =>
//     join(__dirname, p, '**/*.@(mdx|stories.@(js|jsx|ts|tsx))')
//   ),
// ];

export const RN_LIB_STORY_GLOBS = [
  ...RN_LIB_STORY_ROOTS.map((p) => join(__dirname, p, 'Pill/Pill.stories.tsx')),
  ...RN_LIB_STORY_ROOTS.map((p) =>
    join(__dirname, p, 'PillContainer/PillContainer.stories.tsx')
  ),
];
export const ALL_LIB_STORY_GLOBS = [
  ...REACT_LIB_STORY_GLOBS,
  ...RN_LIB_STORY_GLOBS,
];

export const LIB_CONTENT_GLOBS = [
  ...LIB_CONTENT_ROOTS.map((p) => join(__dirname, p, '**/*.{ts,tsx,mdx,html}')),
];
