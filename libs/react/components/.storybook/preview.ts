import type { Decorator, Preview } from '@storybook/react';
import { PageDecorator, decorateWith } from '../src/storybook';
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
  decorators: [decorateWith(PageDecorator)] as Decorator[],
};

export default preview;
