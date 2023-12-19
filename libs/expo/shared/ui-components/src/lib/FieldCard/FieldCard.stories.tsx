import { NoteIcon } from '@monorepo/expo/shared/icons';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import BodyText from '../BodyText';
import { FieldCard } from './FieldCard';

const FieldCardMeta: ComponentMeta<typeof FieldCard> = {
  title: 'FieldCard',
  component: FieldCard,
  args: {
    title: 'title',
    Icon: NoteIcon,
    children: <BodyText>children</BodyText>,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default FieldCardMeta;

type FieldCardStory = ComponentStory<typeof FieldCard>;

export const Basic: FieldCardStory = (args) => <FieldCard {...args} />;
