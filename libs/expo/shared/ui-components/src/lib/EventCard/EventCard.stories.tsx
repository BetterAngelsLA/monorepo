import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { EventCard } from './EventCard';

const EventCardMeta: ComponentMeta<typeof EventCard> = {
  title: 'EventCard',
  component: EventCard,
  args: {
    title: 'Event Card somehthng somet dasf',
    time: '09:00 AM',
    address: '123 Wilshire Blvd',
    participants: [
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '3',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '4',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '3',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '4',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '1',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '2',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '3',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
      {
        id: '4',
        firstName: 'first',
        lastName: 'first',
        image: '',
      },
    ],
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default EventCardMeta;

type PStory = ComponentStory<typeof EventCard>;

export const Basic: PStory = (args) => <EventCard {...args} />;
