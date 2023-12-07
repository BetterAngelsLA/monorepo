import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Alert } from './Alert';

const AlertMeta: ComponentMeta<typeof Alert> = {
  title: 'Alert',
  component: Alert,
  args: { variant: 'warning', text: 'Warning text', actionText: 'Action' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default AlertMeta;

type PStory = ComponentStory<typeof Alert>;

export const Basic: PStory = (args) => <Alert {...args} />;
