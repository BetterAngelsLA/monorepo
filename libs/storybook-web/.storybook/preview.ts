import type { Preview } from '@storybook/react';
import '../../../tailwind/fonts.css';
import '../src/styles/tailwind.css';

const preview: Preview = {
  parameters: { controls: { expanded: true }, layout: 'centered' },
  // parameters: { controls: { expanded: true } },
};

export default preview;
