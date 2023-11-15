import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Textarea } from './Textarea';

const TextareaMeta: ComponentMeta<typeof Textarea> = {
  title: 'Textarea',
  component: Textarea,
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

export default TextareaMeta;

type TextareaStory = ComponentStory<typeof Textarea>;

export const Basic: TextareaStory = (args, context) => {
  const { control } = useForm();
  return <Textarea label="Test" height={200} name="test" control={control} />;
};
