import { dirname, join } from 'path';
import { StoriesSpecifier } from 'storybook/internal/types';
import { fileURLToPath } from 'url';
import { storyFileTypes } from './constants.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SHELTER_APP_LIB_DIR = '../../../libs/react/shelter/src/lib';
export const SHELTER_WEB_APP_DIR = '../../../apps/shelter-web/src/app';

export const REACT_APP_LIB_STORIES: StoriesSpecifier[] = [
  {
    directory: join(__dirname, SHELTER_APP_LIB_DIR),
    files: storyFileTypes,
    titlePrefix: 'Web/Apps/Shelter',
  },
  {
    directory: join(__dirname, SHELTER_WEB_APP_DIR),
    files: storyFileTypes,
    titlePrefix: 'Web/Apps/Shelter Web',
  },
];
