import type { Preview } from '@storybook/react';
// import { SbPage, decorateWith } from '../src/storybook';
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
    // layout: 'centered',
  },
  tags: ['autodocs'],
  //   decorators: [decorateWith(SbPage)] as Decorator[],
};

export default preview;
