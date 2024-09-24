import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { FileCard } from './FileCard';

const FileCardMeta: ComponentMeta<typeof FileCard> = {
  title: 'FileCard',
  component: FileCard,
  args: {
    document: {
      file: {
        url: 'https://via.placeholder.com/150',
      },
      originalFilename: 'originalFilename',
    },
    onPress: () => {},
  },
  decorators: [
    (Story: any) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default FileCardMeta;

type FileCardStory = ComponentStory<typeof FileCard>;

export const Basic: FileCardStory = (args: any) => <FileCard {...args} />;
