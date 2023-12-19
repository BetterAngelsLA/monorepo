import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { View } from 'react-native';
import { Font } from './Font';
import FontLoader from './FontLoader';

const FontMeta: ComponentMeta<typeof Font> = {
  title: 'Font',
  component: Font,
  decorators: [
    (Story) => (
      <FontLoader>
        <View style={{ padding: 16 }}>
          <Story />
        </View>
      </FontLoader>
    ),
  ],
};

export default FontMeta;

type FontStory = ComponentStory<typeof Font>;

export const BetterAngels: FontStory = () => (
  <View style={{ flexDirection: 'row' }}>
    <View style={{ marginRight: 20 }}>
      <Font fontFamily="Poppins-Regular" title="Poppins-Regular" />
      <Font fontFamily="Poppins-Medium" title="Poppins-Medium" />
      <Font fontFamily="Poppins-SemiBold" title="Poppins-SemiBold" />
    </View>
  </View>
);
