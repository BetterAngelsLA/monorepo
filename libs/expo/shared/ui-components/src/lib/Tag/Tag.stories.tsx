import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Tag } from './Tag';

const TagMeta: ComponentMeta<typeof Tag> = {
  title: 'Tag',
  component: Tag,
  decorators: [
    (Story) => {
      return (
        <View style={{ padding: 16 }}>
          <View style={{ padding: 16 }}>
            <Story />
          </View>
        </View>
      );
    },
  ],
};

export default TagMeta;

type TagStory = ComponentStory<typeof Tag>;

export const Basic: TagStory = (args, context) => {
  return <Tag onRemove={() => console.log('Removed')} value="Tag 1" />;
};
