import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Select } from './Select';

const SelectMeta: ComponentMeta<typeof Select> = {
  title: 'Select',
  component: Select,
  decorators: [
    (Story) => {
      return (
        <View style={{ padding: 16 }}>
          <View style={{ padding: 16 }}>
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
