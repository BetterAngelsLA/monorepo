import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { H2 } from './H2';

const H2Meta: ComponentMeta<typeof H2> = {
  title: 'H2',
  component: H2,
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story>Header 2</Story>
      </View>
    ),
  ],
};

export default H2Meta;

type H2Story = ComponentStory<typeof H2>;

export const Basic: H2Story = (args) => <H2 {...args} />;
