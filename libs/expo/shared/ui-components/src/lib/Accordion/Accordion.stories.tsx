import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import TextRegular from '../TextRegular';
import { Accordion } from './Accordion';

const AccordionMeta: ComponentMeta<typeof Accordion> = {
  title: 'Accordion',
  component: Accordion,
  args: {
    title: 'title',
    children: <TextRegular>children</TextRegular>,
  },
  decorators: [
    (Story) => (
      <View style={{ padding: 26 }}>
        <Story />
      </View>
    ),
  ],
};

export default AccordionMeta;

type AccordionStory = ComponentStory<typeof Accordion>;

export const Basic: AccordionStory = (args) => <Accordion {...args} />;
