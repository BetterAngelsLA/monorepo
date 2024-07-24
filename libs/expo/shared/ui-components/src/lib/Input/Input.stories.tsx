import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useForm } from 'react-hook-form';
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
  const { control } = useForm();
  return <Input label="Test" height={56} name="test" control={control} />;
};
