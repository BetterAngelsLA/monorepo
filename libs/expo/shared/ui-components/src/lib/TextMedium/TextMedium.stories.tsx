import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { TextMedium } from './TextMedium';

const TextMediumMeta: ComponentMeta<typeof TextMedium> = {
  title: 'TextMedium',
  component: TextMedium,
  args: { children: 'Paragraph' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default TextMediumMeta;

type PStory = ComponentStory<typeof TextMedium>;

export const Basic: PStory = (args) => <TextMedium {...args} />;
