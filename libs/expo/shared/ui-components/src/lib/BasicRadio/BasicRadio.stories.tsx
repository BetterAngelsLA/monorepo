import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { BasicRadio } from './BasicRadio';

const BasicRadioMeta: ComponentMeta<typeof BasicRadio> = {
  title: 'BasicRadio',
  component: BasicRadio,
  args: {
    label: 'Hello world',
    accessibilityHint: 'custom BasicRadio',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default BasicRadioMeta;

type BasicRadioStory = ComponentStory<typeof BasicRadio>;

export const Basic: BasicRadioStory = (args) => <BasicRadio {...args} />;
