import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { P } from './P';

const PMeta: ComponentMeta<typeof P> = {
  title: 'P',
  component: P,
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story>Paragraph</Story>
      </View>
    ),
  ],
};

export default PMeta;

type PStory = ComponentStory<typeof P>;

export const Basic: PStory = (args) => <P {...args} />;
