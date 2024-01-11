import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { DatePicker } from './DatePicker';

const DatePickerMeta: ComponentMeta<typeof DatePicker> = {
  title: 'DatePicker',
  component: DatePicker,
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

export default DatePickerMeta;

type DatePickerStory = ComponentStory<typeof DatePicker>;

export const Basic: DatePickerStory = (args, context) => {
  const { control } = useForm();
  return <DatePicker label="Test" height={56} name="test" control={control} />;
};
