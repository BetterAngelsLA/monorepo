import { CustomLayout } from '@monorepo/react/storybook';
import type { Preview } from '@storybook/react';
import '../../../libs/tailwind/src/css/base.css';
import '../../../libs/tailwind/src/css/fonts-rn.css';
import '../../../libs/tailwind/src/css/fonts.css';

const preview: Preview = {
  parameters: { controls: { expanded: false }, layout: 'fullscreen' },
  decorators: [CustomLayout],
};

export default preview;
