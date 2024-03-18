import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { NoteCard } from './NoteCard';

const NoteCardMeta: ComponentMeta<typeof NoteCard> = {
  title: 'NoteCard',
  component: NoteCard,
  args: {
    id: '',
    title: 'First',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default NoteCardMeta;

type NoteCardStory = ComponentStory<typeof NoteCard>;

export const Basic: NoteCardStory = (args) => <NoteCard {...args} />;
