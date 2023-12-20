import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { H5 } from './H5';

const H5Meta: ComponentMeta<typeof H5> = {
  title: 'H5',
  component: H5,
  args: { children: 'Heading 4' },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default H5Meta;

type H5Story = ComponentStory<typeof H5>;

export const Basic: H5Story = (args) => <H5 {...args} />;
