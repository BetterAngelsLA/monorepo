import type { Meta, StoryObj } from '@storybook/react';
import { Text, TextVariant } from './text';

const meta: Meta<typeof Text> = {
  title: 'Base UI/Text',
  component: Text,
  args: {
    children: 'Sample Text',
    variant: 'body',
    fontClass: '',
    textColor: '',
    textSize: '',
    fontWeight: '',
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
    fontClass: {
      control: 'text',
    },
    textColor: {
      control: 'text',
    },
    textSize: {
      control: 'text',
    },
    fontWeight: {
      control: 'text',
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
export const HeaderNavbar = textStory('header-navbar');
export const Subheading = textStory('subheading');
export const SubheadingRegular = textStory('subheading-regular');
export const Button = textStory('btn');
export const BodyLarge = textStory('body-lg');
export const BodyBold = textStory('body-bold');
export const Body = textStory('body');
export const BodyLight = textStory('body-light');
export const Tag = textStory('tag');
export const TagSmall = textStory('tag-sm');
export const InputField = textStory('input-field');
export const Caption = textStory('caption');
export const CaptionSmall = textStory('caption-sm');

// PLAYGROUND

export const Playground: Story = {
  render: (args) => <Text {...args} />,
};
