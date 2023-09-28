import { ComponentMeta, ComponentStory } from '@storybook/react-native';
import { StyleSheet, Text, View } from 'react-native';
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

export const Outreach: FontStory = () => (
  <View style={{ flexDirection: 'row' }}>
    <View style={{ marginRight: 20 }}>
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
      <Font fontFamily="IBM-bold" title="IBM-bold" />
      <Font fontFamily="IBM-bold-italic" title="IBM-bold-italic" />
      <Font fontFamily="IBM-semibold" title="IBM-semibold" />
      <Font fontFamily="IBM-semibold-italic" title="IBM-semibold-italic" />
      <Font fontFamily="IBM-medium" title="IBM-medium" />
      <Font fontFamily="IBM-medium-italic" title="IBM-medium-italic" />
      <Font fontFamily="IBM" title="IBM-regular" />
      <Font fontFamily="IBM-italic" title="IBM-regular-italic" />
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
      <Font fontFamily="IBM-light" title="IBM-light" />
      <Font fontFamily="IBM-light-italic" title="IBM-light-italic" />
      <Font fontFamily="IBM-extra-light" title="IBM-extra-light" />
      <Font
        fontFamily="IBM-extra-light-italic"
        title="IBM-extra-light-italic"
      />
      <Font fontFamily="IBM-thin" title="IBM-thin" />
      <Font fontFamily="IBM-thin-italic" title="IBM-thin-italic" />
    </View>
    <View>
      <Font fontFamily="Pragmatica-black" title="Pragmatica-black" />
      <Font
        fontFamily="Pragmatica-black-italic"
        title="Pragmatica-black-italic"
      />
      <Font fontFamily="Pragmatica-extra-bold" title="Pragmatica-extra-bold" />
      <Font
        fontFamily="Pragmatica-extra-bold-italic"
        title="Pragmatica-extra-bold-italic"
      />
      <Font fontFamily="Pragmatica-bold" title="Pragmatica-bold" />
      <Font
        fontFamily="Pragmatica-bold-italic"
        title="Pragmatica-bold-italic"
      />
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
      <Font fontFamily="Pragmatica-medium" title="Pragmatica-medium" />
      <Font
        fontFamily="Pragmatica-medium-italic"
        title="Pragmatica-medium-italic"
      />
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
      <Font fontFamily="Pragmatica-book" title="Pragmatica-book" />
      <Font
        fontFamily="Pragmatica-book-italic"
        title="Pragmatica-book-italic"
      />
      <Font fontFamily="Pragmatica-light" title="Pragmatica-light" />
      <Font
        fontFamily="Pragmatica-light-italic"
        title="Pragmatica-light-italic"
      />
      <Font
        fontFamily="Pragmatica-extra-light"
        title="Pragmatica-extra-light"
      />
      <Font
        fontFamily="Pragmatica-extra-light-italic"
        title="Pragmatica-extra-light-italic"
      />
      <Text style={styles.text}>-</Text>
      <Text style={styles.text}>-</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: 0.25,
  },
});
