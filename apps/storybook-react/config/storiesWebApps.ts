import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { storyFileTypes } from './constants.ts';

export interface StoriesSpecifier {
  directory: string;
  files: string | string[];
  titlePrefix?: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SHELTER_APP_LIB_DIR = '../../../libs/react/shelter/src/lib';
export const SHELTER_OPR_APP_DIR =
  '../../../libs/react/shelter-operator/src/lib/components';

export const REACT_APP_LIB_STORIES: StoriesSpecifier[] = [
  {
    directory: join(__dirname, SHELTER_APP_LIB_DIR),
    files: storyFileTypes,
    titlePrefix: 'Web/Apps/Shelter',
  },
  {
    directory: join(__dirname, SHELTER_OPR_APP_DIR),
    files: storyFileTypes,
    titlePrefix: 'Web/Apps/ShelterOperator',
  },
];
