import { PlusIcon } from '@monorepo/expo/shared/icons';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Button } from './Button';

const ButtonMeta: ComponentMeta<typeof Button> = {
  title: 'Button',
  component: Button,
  args: {
    title: 'Hello world',
    variant: 'primary',
    icon: <PlusIcon size="xs" />,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
};

export default ButtonMeta;

type ButtonStory = ComponentStory<typeof Button>;

export const Basic: ButtonStory = (args) => <Button {...args} />;
