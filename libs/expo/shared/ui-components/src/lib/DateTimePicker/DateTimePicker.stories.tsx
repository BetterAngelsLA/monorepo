import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { DateTimePicker } from './DateTimePicker';

const DateTimePickerMeta: ComponentMeta<typeof DateTimePicker> = {
  title: 'DateTimePicker',
  component: DateTimePicker,
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

export default DateTimePickerMeta;

type DateTimePickerStory = ComponentStory<typeof DateTimePicker>;

export const Basic: DateTimePickerStory = (args, context) => {
  const { control } = useForm();
  return (
    <DateTimePicker label="Test" height={56} name="test" control={control} />
  );
};
