import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Avatar } from './Avatar';

const AvatarMeta: ComponentMeta<typeof Avatar> = {
  title: 'Avatar',
  component: Avatar,
  args: { firstName: 'Firstname', lastName: 'Lastname', size: 'md' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default AvatarMeta;

type PStory = ComponentStory<typeof Avatar>;

export const Basic: PStory = (args) => <Avatar {...args} />;
