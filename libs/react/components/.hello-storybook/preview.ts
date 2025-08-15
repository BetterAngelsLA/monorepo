import type { Decorator, Preview } from '@storybook/react';
import { SbPage, decorateWith } from '../src/storybook';
import './tailwind.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [decorateWith(SbPage)] as Decorator[],
};

export default preview;
