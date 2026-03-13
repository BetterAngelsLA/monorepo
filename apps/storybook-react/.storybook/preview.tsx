import { CustomLayout } from '@monorepo/react/storybook';
import type { Preview } from '@storybook/react';
import '../../../libs/tailwind/src/css/fonts-rn.css';
import '../../../libs/tailwind/src/css/fonts.css';
import '../src/styles/tailwind.css';

const preview: Preview = {
  parameters: { controls: { expanded: false }, layout: 'fullscreen' },
  decorators: [CustomLayout],
};

export default preview;
