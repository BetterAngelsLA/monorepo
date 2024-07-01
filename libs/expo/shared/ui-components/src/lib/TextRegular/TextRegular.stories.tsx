import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { TextRegular } from './TextRegular';

const TextRegularMeta: ComponentMeta<typeof TextRegular> = {
  title: 'TextRegular',
  component: TextRegular,
  args: { children: 'Paragraph' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default TextRegularMeta;

type PStory = ComponentStory<typeof TextRegular>;

export const Basic: PStory = (args) => <TextRegular {...args} />;
