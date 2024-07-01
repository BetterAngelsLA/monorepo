import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { TextBold } from './TextBold';

const TextBoldMeta: ComponentMeta<typeof TextBold> = {
  title: 'TextBold',
  component: TextBold,
  args: { children: 'Paragraph' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default TextBoldMeta;

type PStory = ComponentStory<typeof TextBold>;

export const Basic: PStory = (args) => <TextBold {...args} />;
