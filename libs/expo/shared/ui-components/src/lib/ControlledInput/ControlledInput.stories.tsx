import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { ControlledInput } from './ControlledInput';

const ControlledInputMeta: ComponentMeta<typeof ControlledInput> = {
  title: 'ControlledInput',
  component: ControlledInput,
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

export default ControlledInputMeta;

type ControlledInputStory = ComponentStory<typeof ControlledInput>;

export const Basic: ControlledInputStory = (args, context) => {
  const { control } = useForm();
  return <ControlledInput label="Test" name="test" control={control} />;
};
