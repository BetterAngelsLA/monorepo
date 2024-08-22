import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Select } from './Select';

const SelectMeta: ComponentMeta<typeof Select> = {
  title: 'Select',
  component: Select,
  decorators: [
    (Story) => {
      return (
        <View style={{ padding: Spacings.sm }}>
          <View style={{ padding: Spacings.sm }}>
            <Story />
          </View>
        </View>
      );
    },
  ],
};

export default SelectMeta;

type SelectStory = ComponentStory<typeof Select>;

export const Basic: SelectStory = (args, context) => {
  return (
    <Select
      label="Test"
      placeholder="Select something"
      setExternalValue={(value) => console.log(value)}
      data={['Test 1', 'Test 2']}
    />
  );
};
