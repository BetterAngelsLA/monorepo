import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Input } from './Input';

const InputMeta: ComponentMeta<typeof Input> = {
  title: 'Input',
  component: Input,
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

export default InputMeta;

type InputStory = ComponentStory<typeof Input>;

export const Basic: InputStory = (args, context) => {
  const [value, setValue] = useState('');
  return (
    <Input label="Test" height={56} value={value} onChangeText={setValue} />
  );
};
