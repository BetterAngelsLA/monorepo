import type { Preview } from '@storybook/react';
import '../../../tailwind/fonts-rn.css';
import '../../../tailwind/fonts.css';
import '../src/styles/tailwind.css';

const preview: Preview = {
  parameters: { controls: { expanded: true }, layout: 'centered' },
};

export default preview;
