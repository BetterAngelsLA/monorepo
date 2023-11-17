import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { StatusBadge } from './StatusBadge';

const StatusBadgeMeta: ComponentMeta<typeof StatusBadge> = {
  title: 'StatusBadge',
  component: StatusBadge,
  args: {
    title: 'Accepted',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default StatusBadgeMeta;

type StatusBadgeStory = ComponentStory<typeof StatusBadge>;

export const Basic: StatusBadgeStory = (args) => <StatusBadge {...args} />;
