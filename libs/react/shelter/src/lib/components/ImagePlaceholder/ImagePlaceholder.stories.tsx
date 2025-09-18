import type { Meta, StoryObj } from '@storybook/react';
import { ImagePlaceholder as StoryComponent, TProps } from './ImagePlaceholder';

const meta: Meta<typeof StoryComponent> = {
  component: StoryComponent,
  title: 'Image Placeholder',
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: TProps = {
  className: 'w-80',
};

export const ImagePlaceholder: Story = {
  render: (args) => {
    const storyArgs = { ...defaultArgs, ...args };

    return <StoryComponent {...storyArgs} />;
  },
};
