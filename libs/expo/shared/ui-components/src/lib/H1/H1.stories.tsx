import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { H1 } from './H1';

const H1Meta: ComponentMeta<typeof H1> = {
  title: 'H1',
  component: H1,
  args: { children: 'Heading 1' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default H1Meta;

type H1Story = ComponentStory<typeof H1>;

export const Basic: H1Story = (args) => <H1 {...args} />;
