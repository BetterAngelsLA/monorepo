import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { H4 } from './H4';

const H4Meta: ComponentMeta<typeof H4> = {
  title: 'H4',
  component: H4,
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story>Header 4</Story>
      </View>
    ),
  ],
};

export default H4Meta;

type H4Story = ComponentStory<typeof H4>;

export const Basic: H4Story = (args) => <H4 {...args} />;
