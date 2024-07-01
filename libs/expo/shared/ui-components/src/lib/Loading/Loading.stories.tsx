import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Loading } from './Loading';

const ButtonMeta: ComponentMeta<typeof Loading> = {
  title: 'Loading',
  component: Loading,
  args: {
    size: 'large',
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

type ButtonStory = ComponentStory<typeof Loading>;

export const Basic: ButtonStory = (args) => <Loading {...args} />;
