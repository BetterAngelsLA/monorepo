import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { InputBasic } from './InputBasic';

const InputBasicMeta: ComponentMeta<typeof InputBasic> = {
  title: 'InputBasic',
  component: InputBasic,
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

export default InputBasicMeta;

type InputBasicStory = ComponentStory<typeof InputBasic>;

export const Basic: InputBasicStory = (args, context) => {
  const [value, setValue] = useState('');
  return (
    <InputBasic
      label="Test"
      height={56}
      value={value}
      onChangeText={setValue}
    />
  );
};
