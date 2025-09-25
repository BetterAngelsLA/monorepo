import { join } from 'path';
import { StoriesSpecifier } from 'storybook/internal/types';
import { storyFileTypes } from './constants';

export const SHELTER_APP_LIB_DIR = '../../../libs/react/shelter/src/lib';

export const REACT_APP_LIB_STORIES: StoriesSpecifier[] = [
  {
    directory: join(__dirname, SHELTER_APP_LIB_DIR),
    files: storyFileTypes,
    titlePrefix: 'Web/Apps/Shelter',
  },
];
