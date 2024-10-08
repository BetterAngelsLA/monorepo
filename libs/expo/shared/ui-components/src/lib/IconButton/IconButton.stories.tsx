import { PlusIcon } from '@monorepo/expo/shared/icons';
import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { IconButton } from './IconButton';

const IconButtonMeta: ComponentMeta<typeof IconButton> = {
  title: 'IconButton',
  component: IconButton,
  args: {
    variant: 'primary',
    children: <PlusIcon size="sm" />,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: Spacings.sm }}>
        <Story />
      </View>
    ),
  ],
};

export default IconButtonMeta;

type IconButtonStory = ComponentStory<typeof IconButton>;

export const Basic: IconButtonStory = (args) => <IconButton {...args} />;
