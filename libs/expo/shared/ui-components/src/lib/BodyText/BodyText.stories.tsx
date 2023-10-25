import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { BodyText } from './BodyText';

const BodyTextMeta: ComponentMeta<typeof BodyText> = {
  title: 'BodyText',
  component: BodyText,
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story>Paragraph</Story>
      </View>
    ),
  ],
};

export default BodyTextMeta;

type PStory = ComponentStory<typeof BodyText>;

export const Basic: PStory = (args) => <BodyText {...args} />;
