import { Spacings } from '@monorepo/expo/shared/static';
import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { CardWrapper } from './CardWrapper';

const CardWrapperMeta: ComponentMeta<typeof CardWrapper> = {
  title: 'CardWrapper',
  component: CardWrapper,
  args: {
    title: 'Title',
    subtitle: 'Subtitle',
  },
  decorators: [
    (Story) => (
      <View style={{ padding: Spacings.sm }}>
        <Story />
      </View>
    ),
  ],
};

export default CardWrapperMeta;

type CardWrapperStory = ComponentStory<typeof CardWrapper>;

export const Basic: CardWrapperStory = (args) => <CardWrapper {...args} />;
