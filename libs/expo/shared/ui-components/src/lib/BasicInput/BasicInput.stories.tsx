import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { BasicInput } from './BasicInput';

const BasicInputMeta: ComponentMeta<typeof BasicInput> = {
  title: 'BasicInput',
  component: BasicInput,
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

export default BasicInputMeta;

type BasicInputStory = ComponentStory<typeof BasicInput>;

export const Basic: BasicInputStory = (args, context) => {
  const [value, setValue] = useState('');
  return (
    <BasicInput
      label="Test"
      height={56}
      value={value}
      onChangeText={setValue}
    />
  );
};
