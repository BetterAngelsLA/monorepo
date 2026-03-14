import type { Meta, StoryObj } from '@storybook/react';
import { Text, TextVariant } from './text';

const meta: Meta<typeof Text> = {
  title: 'Base UI/Text',
  component: Text,
  args: {
    children: 'Sample Text',
    variant: 'body',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'header-lg',
        'header-md',
        'header-navbar',
        'subheading',
        'subheading-regular',
        'btn',
        'body-lg',
        'body-bold',
        'body',
        'body-light',
        'tag',
        'tag-sm',
        'input-field',
        'caption',
        'caption-sm',
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Text>;

const textStory = (variant: TextVariant): Story => ({
  render: () => <Text variant={variant}>{variant}</Text>,
});

export const HeaderLarge = textStory('header-lg');
export const HeaderMedium = textStory('header-md');
export const Subheading = textStory('subheading');
export const Body = textStory('body');
export const Caption = textStory('caption');

// PLAYGROUND

export const Playground: Story = {
  render: (args) => <Text {...args} />,
};
