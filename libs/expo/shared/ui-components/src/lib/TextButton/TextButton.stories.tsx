import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { TextButton } from './TextButton';

const TextButtonMeta: ComponentMeta<typeof TextButton> = {
  title: 'TextButton',
  component: TextButton,
  args: {
    title: 'Hello world',
    icon: <PlusIcon size="xs" />,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: Spacings.sm }}>
        <Story />
      </View>
    ),
  ],
};

export default TextButtonMeta;

type TextButtonStory = ComponentStory<typeof TextButton>;

export const Basic: TextButtonStory = (args) => <TextButton {...args} />;
