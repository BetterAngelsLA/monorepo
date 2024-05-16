import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import TextRegular from '../TextRegular';
import { FieldCard } from './FieldCard';

const FieldCardMeta: ComponentMeta<typeof FieldCard> = {
  title: 'FieldCard',
  component: FieldCard,
  args: {
    title: 'title',
    children: <TextRegular>children</TextRegular>,
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
