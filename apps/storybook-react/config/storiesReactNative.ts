import { join } from 'path';
import { StoriesSpecifier } from 'storybook/internal/types';

export const RN_SHARED_LIB_STORIES: StoriesSpecifier[] = [
  {
    directory: join(
      __dirname,
      '../../../libs/expo/shared/ui-components/src/lib/Pill'
    ),
    files: 'Pill.stories.tsx',
    titlePrefix: 'RN Components',
  },
  {
    directory: join(
      __dirname,
      '../../../libs/expo/shared/ui-components/src/lib/PillContainer'
    ),
    files: 'PillContainer.stories.tsx',
    titlePrefix: 'RN Components',
  },
];
