import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Radio } from './Radio';

const RadioMeta: ComponentMeta<typeof Radio> = {
  title: 'Radio',
  component: Radio,
  args: {
    label: 'Hello world',
    accessibilityHint: 'custom Radio',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default RadioMeta;

type RadioStory = ComponentStory<typeof Radio>;

export const Basic: RadioStory = (args) => <Radio {...args} />;
