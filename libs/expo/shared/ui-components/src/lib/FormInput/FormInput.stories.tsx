import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { FormInput } from './FormInput';

const FormInputMeta: ComponentMeta<typeof FormInput> = {
  title: 'FormInput',
  component: FormInput,
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

export default FormInputMeta;

type FormInputStory = ComponentStory<typeof FormInput>;

export const Basic: FormInputStory = (args, context) => {
  const { control } = useForm();
  return <FormInput label="Test" name="test" control={control} />;
};
