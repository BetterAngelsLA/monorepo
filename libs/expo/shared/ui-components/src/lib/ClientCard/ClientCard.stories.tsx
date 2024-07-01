import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { ClientCard } from './ClientCard';

const ClientCardMeta: ComponentMeta<typeof ClientCard> = {
  title: 'ClientCard',
  component: ClientCard,
  args: {
    imageUrl: '',
    firstName: 'First',
    lastName: 'Last',
    address: 'address',
    progress: 10,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default ClientCardMeta;

type ClientCardStory = ComponentStory<typeof ClientCard>;

export const Basic: ClientCardStory = (args) => <ClientCard {...args} />;
