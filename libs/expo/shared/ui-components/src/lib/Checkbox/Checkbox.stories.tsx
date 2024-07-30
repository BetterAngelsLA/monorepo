import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Checkbox } from './Checkbox';

const CheckboxMeta: ComponentMeta<typeof Checkbox> = {
  title: 'Checkbox',
  component: Checkbox,
  args: {
    label: 'Hello world',
    accessibilityHint: 'custom checkbox',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: Spacings.sm }}>
        <Story />
      </View>
    ),
  ],
};

export default CheckboxMeta;

type CheckboxStory = ComponentStory<typeof Checkbox>;

export const Basic: CheckboxStory = (args) => <Checkbox {...args} />;
