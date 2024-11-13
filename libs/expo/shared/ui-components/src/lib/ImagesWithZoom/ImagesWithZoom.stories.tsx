import type { Meta, StoryObj } from '@storybook/react';
import { Image } from 'react-native';
import { ImagesWithZoom } from './ImagesWithZoom';

const meta: Meta<typeof ImagesWithZoom> = {
  title: 'ImagesWithZoom',
  component: ImagesWithZoom,
  args: {
    title: 'title',
    imageUrls: [
      {
        url: 'https://images.unsplash.com/photo-1576158114254-3ba81558b87d?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
    ],
    children: (
      <Image
        style={{ width: 207, height: 346 }}
        source={{
          uri: 'https://images.unsplash.com/photo-1576158114254-3ba81558b87d?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    ),
  },
};

export default meta;

type ImagesWithZoomStory = StoryObj<typeof ImagesWithZoom>;

export const Basic: ImagesWithZoomStory = {
  args: {
    title: 'title',
  },
};
