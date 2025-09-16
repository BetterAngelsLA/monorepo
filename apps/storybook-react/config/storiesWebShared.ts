import { join } from 'path';
import { StoriesSpecifier } from 'storybook/internal/types';
import { storyFileTypes } from './constants';

// React Shared Libs
const REACT_ICON_COMPONENT_DIRS = [
  '../../../libs/react/icons/src/lib/components',
];

export const REACT_COMPONENT_STORY_DIRS = [
  '../../../libs/react/components/src/lib',
];

export const REACT_SHARED_LIB_STORIES: StoriesSpecifier[] = [
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
