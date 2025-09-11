import type { Meta, StoryObj } from '@storybook/react';
import { ImageCarousel as StoryComponent, TProps } from './ImageCarousel';

const meta: Meta<typeof StoryComponent> = {
  title: 'ImageCarousel',
  component: StoryComponent,
};
export default meta;

type Story = StoryObj<typeof StoryComponent>;

const defaultArgs: Pick<TProps, 'imageUrls'> = {
  imageUrls: [
    'https://fastly.picsum.photos/id/11/2500/1667.jpg?hmac=xxjFJtAPgshYkysU_aqx2sZir-kIOjNR9vx0te7GycQ',
    'https://fastly.picsum.photos/id/29/4000/2670.jpg?hmac=rCbRAl24FzrSzwlR5tL-Aqzyu5tX_PA95VJtnUXegGU',
    'https://fastly.picsum.photos/id/13/2500/1667.jpg?hmac=SoX9UoHhN8HyklRA4A3vcCWJMVtiBXUg0W4ljWTor7s',
    'https://fastly.picsum.photos/id/14/2500/1667.jpg?hmac=ssQyTcZRRumHXVbQAVlXTx-MGBxm6NHWD3SryQ48G-o',
  ],
};

export const ImageCarousel: Story = {
  render: (args) => {
    const baseArgs: TProps = {
      ...defaultArgs,
      ...args,
    };

    return <StoryComponent {...baseArgs} className="h-80" />;
  },
};
