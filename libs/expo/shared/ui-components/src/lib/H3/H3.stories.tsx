import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { H3 } from './H3';

const H3Meta: ComponentMeta<typeof H3> = {
  title: 'H3',
  component: H3,
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story>Header 3</Story>
      </View>
    ),
  ],
};

export default H3Meta;

type H3Story = ComponentStory<typeof H3>;

export const Basic: H3Story = (args) => <H3 {...args} />;
